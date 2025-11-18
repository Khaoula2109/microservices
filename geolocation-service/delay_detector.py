import redis
import json
import time
import os
import pika
from datetime import datetime, time as dt_time, timedelta
from routes_data import ROUTES

REDIS_HOST = os.getenv('REDIS_HOST', 'redis-cache')
REDIS_PORT = 6379
REDIS_PASSWORD = os.getenv('REDIS_PASSWORD', None)
REDIS_POSITIONS_KEY = "bus_positions"

DELAY_THRESHOLD_SECONDS = 30
CHECK_INTERVAL_SECONDS = 30
ROUTE_START_TIME = dt_time(8, 0, 0)

RABBITMQ_URI = os.getenv('RABBITMQ_URI', 'amqp://user:password@rabbitmq-service:5672')
RABBITMQ_EXCHANGE = os.getenv('RABBITMQ_EXCHANGE', 'transport_events')
RABBITMQ_ROUTING_KEY = 'bus.delayed'

class DelayDetector:
    def __init__(self):
        self.db = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, password=REDIS_PASSWORD, decode_responses=True)
        self.notified_buses = set()
        self.rabbit_channel = None
        self.rabbit_connection = None

    def connect_to_redis(self):
        while True:
            try:
                self.db.ping()
                print("Détecteur de retard : Connecté à Redis.")
                break
            except redis.exceptions.ConnectionError as e:
                print(f"Détecteur : Connexion à Redis échouée... {e}. Nouvelle tentative dans 5s.")
                time.sleep(5)

    def connect_to_rabbitmq(self):
        while True:
            try:
                credentials = pika.PlainCredentials('user', 'password')
                parameters = pika.ConnectionParameters(
                    host='rabbitmq-service',
                    port=5672,
                    credentials=credentials
                )
                self.rabbit_connection = pika.BlockingConnection(parameters)
                self.rabbit_channel = self.rabbit_connection.channel()

                self.rabbit_channel.exchange_declare(exchange=RABBITMQ_EXCHANGE, exchange_type='topic', durable=True)

                print("Détecteur de retard : Connecté à RabbitMQ.")
                break
            except pika.exceptions.AMQPConnectionError as e:
                print(f"Détecteur : Connexion à RabbitMQ échouée... {e}. Nouvelle tentative dans 5s.")
                time.sleep(5)

    def get_expected_arrival_timestamp(self, bus_id: str, stop_index: int) -> float:
        try:
            minutes_offset = ROUTES[bus_id][stop_index]['minutes_from_start']
            today = datetime.now().date()
            start_datetime = datetime.combine(today, ROUTE_START_TIME)
            expected_datetime = start_datetime + timedelta(minutes=minutes_offset)
            return expected_datetime.timestamp()
        except (KeyError, IndexError):
            print(f"Données de route invalides pour {bus_id} à l'index {stop_index}")
            return -1

    def publish_delay_event(self, bus_id: str, delay_minutes: int):
        message = {
            "routeName": bus_id,
            "delay": delay_minutes,
            "timestamp": datetime.now().isoformat()
        }

        try:
            payload = json.dumps(message)
            self.rabbit_channel.basic_publish(
                exchange=RABBITMQ_EXCHANGE,
                routing_key=RABBITMQ_ROUTING_KEY,
                body=payload,
                properties=pika.BasicProperties(
                    content_type='application/json',
                    delivery_mode=pika.DeliveryMode.Persistent
                )
            )
            print(f"ALERTE : {bus_id} est en retard de {delay_minutes} min. Événement RabbitMQ envoyé.")
            self.notified_buses.add(bus_id)

        except pika.exceptions.AMQPError as e:
            print(f"Erreur lors de la publication RabbitMQ : {e}. Tentative de reconnexion...")
            self.connect_to_rabbitmq()
        except Exception as e:
            print(f"Erreur inattendue lors de la publication : {e}")


    def check_for_delays(self):
        print("Lancement du service de détection de retard...")
        self.connect_to_redis()
        self.connect_to_rabbitmq()

        while True:
            try:
                all_bus_positions = self.db.hgetall(REDIS_POSITIONS_KEY)

                if not all_bus_positions:
                    print("Aucune donnée de bus trouvée dans Redis. En attente...")
                    time.sleep(CHECK_INTERVAL_SECONDS)
                    continue

                for bus_id, position_json in all_bus_positions.items():
                    data = json.loads(position_json)
                    current_time = data['timestamp']
                    stop_index = data['stopIndex']

                    expected_time = self.get_expected_arrival_timestamp(bus_id, stop_index)
                    if expected_time == -1:
                        continue

                    delay_seconds = current_time - expected_time

                    if delay_seconds > DELAY_THRESHOLD_SECONDS:
                        if bus_id not in self.notified_buses:
                            delay_minutes = round(delay_seconds / 60)

                            self.publish_delay_event(bus_id, delay_minutes)

                    elif delay_seconds < 0 and bus_id in self.notified_buses:
                        print(f"INFO : {bus_id} est de retour à l'heure. Nettoyage de la notification.")
                        self.notified_buses.remove(bus_id)

            except redis.exceptions.ConnectionError as e:
                print(f"Détecteur : Perte de connexion Redis. {e}")
                self.connect_to_redis()
            except pika.exceptions.AMQPError as e:
                print(f"Détecteur : Perte de connexion RabbitMQ. {e}")
                self.connect_to_rabbitmq()
            except Exception as e:
                print(f"Une erreur est survenue dans le détecteur: {e}")

            time.sleep(CHECK_INTERVAL_SECONDS)

if __name__ == "__main__":
    detector = DelayDetector()
    detector.check_for_delays()