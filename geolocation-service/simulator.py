
import redis
import json
import time
import os
import random
from routes_data import ROUTES

REDIS_KEY = "bus_positions"

# Capacité totale pour chaque type de bus
BUS_CAPACITIES = {
    "BUS-12": 50,
    "BUS-07": 45,
    "BUS-19": 60,
    "BUS-30": 50,
    "BUS-04": 55,
}

def run_simulator():
    print("Démarrage du simulateur de bus - BUS-07 toujours en retard...")
    try:
        redis_host = os.getenv('REDIS_HOST', 'redis-cache')
        redis_password = os.getenv('REDIS_PASSWORD', None)
        r = redis.Redis(host=redis_host, port=6379, password=redis_password, decode_responses=True)
        r.ping()
        print(f"Connecté à Redis avec succès .")
    except redis.exceptions.ConnectionError as e:
        print(f"Erreur de connexion à Redis: {e}")
        return

    route_indexes = {bus_id: 0 for bus_id in ROUTES.keys()}

    # Initialiser l'occupation pour chaque bus (varie au fil du temps)
    bus_occupancy = {bus_id: random.randint(10, 30) for bus_id in ROUTES.keys()}

    configured_delays = {
        "BUS-07": 25 * 60,  
        "BUS-04": 0,        
        "BUS-30": 0,          
        "BUS-12": 0,        
        "BUS-19": 0,        
    }
    

    small_delays = {
        "BUS-04": random.randint(0, 300), 
        "BUS-30": random.randint(0, 300),
        "BUS-12": random.randint(0, 180),  
        "BUS-19": random.randint(0, 240), 
    }
    
    iteration_count = 0

    while True:
        try:
            pipe = r.pipeline()

            for bus_id, route in ROUTES.items():
                index = route_indexes[bus_id]
                current_position_data = route[index]
                

                base_timestamp = time.time()
                

                configured_delay = configured_delays.get(bus_id, 0)
                small_delay = small_delays.get(bus_id, 0)
                

                if bus_id == "BUS-07":
                    current_timestamp = base_timestamp + configured_delay
                else:

                    current_timestamp = base_timestamp + small_delay

                # Simuler des changements d'occupation à chaque arrêt
                # Les gens montent et descendent
                capacity = BUS_CAPACITIES.get(bus_id, 50)
                current_occupancy = bus_occupancy.get(bus_id, 20)

                # Changement aléatoire: -5 à +8 passagers à chaque arrêt
                change = random.randint(-5, 8)
                new_occupancy = max(0, min(capacity, current_occupancy + change))
                bus_occupancy[bus_id] = new_occupancy

                # Calculer le taux d'occupation en pourcentage
                occupancy_rate = round((new_occupancy / capacity) * 100)

                data_to_store = {
                    "busId": bus_id,
                    "latitude": current_position_data["latitude"],
                    "longitude": current_position_data["longitude"],
                    "timestamp": current_timestamp,
                    "stopIndex": index,
                    "capacity": {
                        "total": capacity,
                        "occupied": new_occupancy,
                        "available": capacity - new_occupancy,
                        "occupancyRate": occupancy_rate
                    }
                }

                pipe.hset(REDIS_KEY, bus_id, json.dumps(data_to_store))
                

                route_indexes[bus_id] = (index + 1) % len(route)

            pipe.execute()
            iteration_count += 1
            

            status_messages = []
            for bus_id in ROUTES.keys():
                occupancy = bus_occupancy.get(bus_id, 0)
                capacity = BUS_CAPACITIES.get(bus_id, 50)
                if bus_id == "BUS-07":
                    status_messages.append(f"🚨 {bus_id}: 25min RETARD ({occupancy}/{capacity})")
                else:
                    delay_min = small_delays.get(bus_id, 0) // 60
                    if delay_min > 0:
                        status_messages.append(f"⚠️ {bus_id}: {delay_min}min retard ({occupancy}/{capacity})")
                    else:
                        status_messages.append(f"✅ {bus_id}: À l'heure ({occupancy}/{capacity})")

            print(f"🔄 Itération {iteration_count} - {', '.join(status_messages)}")
                
            time.sleep(8)  

        except redis.exceptions.ConnectionError as e:
            print(f"Perte de connexion à Redis. Reconnexion... {e}")
            time.sleep(5)
        except Exception as e:
            print(f"Erreur simulateur: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_simulator()