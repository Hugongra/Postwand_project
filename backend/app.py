import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from dotenv import load_dotenv

_env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(_env_path)

from flask import Flask
from flask_cors import CORS
from datetime import  timedelta
import logging

logging.getLogger("httpx").setLevel(logging.WARNING)

#MIDDLEWARES
from backend.middlewares.translation import init_translation
from backend.middlewares.convert_to_json import init_convert_json_response
from backend.middlewares.coop_headers import init_coop_headers

#ENDPOINTS
from backend.routes.brands import brand_bp
from backend.routes.auth import auth_bp
from backend.routes.integrations import integrations_auth_bp
from backend.routes.scheduler import scheduler_bp
from backend.routes.create_text import create_text_bp
from backend.routes.edit_images import edit_image_bp
from backend.routes.images import images_bp
from backend.routes.stripe import stripe_bp
from backend.routes.usage import usage_bp
from backend.routes.zernio import zernio_bp
from backend.routes.agent import agent_bp
from backend.post_api import post_api_bp

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.config['JSON_AS_ASCII'] = False 
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['MAX_FORM_MEMORY_SIZE'] = 16 * 1024 * 1024  # 16MB for form data (handles base64 encoded images)
app.config['MAX_FORM_PARTS'] = 1000  # Maximum number of form parts

# Cookies de sesión (HTTPS local / cross-origin: Secure + SameSite=None)
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),
    SESSION_COOKIE_NAME='threads_session',
    REMEMBER_COOKIE_SECURE=True,
    REMEMBER_COOKIE_HTTPONLY=True,
    REMEMBER_COOKIE_SAMESITE='None',
)

# CORS configuration for production
CORS(app, 
     supports_credentials=True,
     origins=[
         "https://localhost:5174",
         "https://127.0.0.1:5174",
         "https://threads-dev.local:5174",
         "http://localhost:5174",
         "http://127.0.0.1:5174",
         "http://threads-dev.local:5174",
         "https://app.postwand.io",
         "https://accounts.google.com"
     ],
     allow_headers=["Content-Type", "Authorization", "X-CSRFToken", "X-Requested-With"],
     expose_headers=["Content-Type", "X-CSRFToken"],
     methods=['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT', 'PATCH'],
     max_age=600)
     
#Middlewares
init_convert_json_response(app)
init_coop_headers(app)
init_translation(app)


# API Prefix Configuration
# Frontend siempre usa rutas /api/... El proxy de Vite reenvía a Flask.
# Por defecto /api para que login/registro funcionen en local sin tocar .env.
# En producción (proxy que quita /api): pon en .env  FLASK_API_PREFIX=   (vacío explícito)
_raw_prefix = os.environ.get("FLASK_API_PREFIX")
API_PREFIX = "/api" if _raw_prefix is None else _raw_prefix

# Register blueprints with configurable prefix
app.register_blueprint(brand_bp, url_prefix=API_PREFIX)
app.register_blueprint(auth_bp, url_prefix=API_PREFIX)
app.register_blueprint(integrations_auth_bp, url_prefix=API_PREFIX)
app.register_blueprint(scheduler_bp, url_prefix=API_PREFIX)
app.register_blueprint(create_text_bp, url_prefix=API_PREFIX)
app.register_blueprint(edit_image_bp, url_prefix=API_PREFIX)
app.register_blueprint(images_bp, url_prefix=API_PREFIX)
app.register_blueprint(stripe_bp, url_prefix=API_PREFIX)
app.register_blueprint(usage_bp, url_prefix=API_PREFIX)
app.register_blueprint(zernio_bp, url_prefix=API_PREFIX)
app.register_blueprint(agent_bp, url_prefix=API_PREFIX)

# Register API v1 blueprint (has its own prefix)
app.register_blueprint(post_api_bp)


if __name__ == '__main__':
    # HTTPS local: mismo efecto que ssl_context=('../https_certs/localhost+3.pem', ...)
    # pero resuelto desde la ubicación de app.py (válido aunque el cwd no sea backend/).
    _here = os.path.dirname(os.path.abspath(__file__))
    _ssl = (
        os.path.join(_here, '..', 'https_certs', 'localhost+3.pem'),
        os.path.join(_here, '..', 'https_certs', 'localhost+3-key.pem'),
    )
    app.run(host='0.0.0.0', port=5000, debug=True, ssl_context=_ssl)







