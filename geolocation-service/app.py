
from flask import Flask, jsonify, g
from services import GeolocationService
from exceptions import ApiException, NotFoundException
from decorators import require_gateway_auth
import traceback
import time
import os

app = Flask(__name__)


geolocation_service = None

def get_geolocation_service():
    """Factory pour obtenir ou initialiser le service (compatible Gunicorn)"""
    global geolocation_service
    

    if geolocation_service is not None:
        return geolocation_service
    

    print("🔄 Initialisation du service de géolocalisation...")
    max_retries = 5
    retry_delay = 5
    
    for attempt in range(max_retries):
        try:
            print(f"🔄 Tentative {attempt + 1}/{max_retries} de connexion à Redis...")
            geolocation_service = GeolocationService()
            print("✅ Service de géolocation initialisé avec succès!")
            return geolocation_service
        except ConnectionError as e:
            print(f"❌ Échec tentative {attempt + 1}: {e}")
            if attempt == max_retries - 1:
                print("💥 Échec critique: Impossible d'initialiser le service de géolocalisation")
                return None
            print(f"⏳ Nouvelle tentative dans {retry_delay} secondes...")
            time.sleep(retry_delay)
        except Exception as e:
            print(f"❌ Erreur inattendue: {e}")
            print(traceback.format_exc())
            return None
    
    return None

@app.before_request
def before_request():
    """Initialiser le service avant chaque requête si nécessaire"""
    global geolocation_service
    if geolocation_service is None:
        geolocation_service = get_geolocation_service()

@app.route('/api/geolocation/bus/<string:bus_number>', methods=['GET'])
@require_gateway_auth
def get_bus_location(bus_number: str):
    try:
        print(f"Controller: Requête reçue pour {bus_number} par {g.user_email}")
        

        service = get_geolocation_service()
        if service is None:
            return jsonify({
                "success": False,
                "error": "Service de géolocalisation temporairement indisponible"
            }), 503
            
        position_data = service.get_bus_position(bus_number)
        return jsonify(position_data), 200
        
    except NotFoundException as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 404
    except Exception as e:
        print(f"❌ Erreur dans get_bus_location: {e}")
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur"
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    service = get_geolocation_service()
    status = "UP" if service is not None else "DOWN"
    return jsonify({
        "status": status,
        "service": "geolocation-service",
        "redis_connected": service is not None
    }), 200

@app.route('/api/geolocation/test-redis', methods=['GET'])
def test_redis():
    """Endpoint de test pour vérifier la connexion Redis"""
    try:
        service = get_geolocation_service()
        if service is None:
            return jsonify({"error": "Service non initialisé"}), 503
            

        service.db.ping()
        return jsonify({
            "redis_status": "connected",
            "message": "Connexion Redis OK"
        }), 200
    except Exception as e:
        return jsonify({
            "redis_status": "disconnected",
            "error": str(e)
        }), 500


if __name__ == '__main__':

    service = get_geolocation_service()
    if service is None:
        print("⚠️ Attention: Service de géolocalisation non initialisé")
    
    app.run(debug=True, host='0.0.0.0', port=5000)