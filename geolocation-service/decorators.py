from functools import wraps
from flask import request, jsonify

def require_gateway_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_email = request.headers.get('X-User-Email')

        if not user_email:
            return jsonify({
                'success': False,
                'error': 'Non authentifié - Requête doit passer par la Gateway'
            }), 401

        from flask import g
        g.user_email = user_email

        print(f"✅ Utilisateur authentifié via Gateway: {user_email}")
        return f(*args, **kwargs)

    return decorated_function