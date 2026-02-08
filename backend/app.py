import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask
from flask_cors import CORS
from datetime import  timedelta
from dotenv import load_dotenv
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
from backend.routes.ads.createAds import create_ads_bp
from backend.post_api import post_api_bp

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)


app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.config['JSON_AS_ASCII'] = False 
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
app.config['MAX_FORM_MEMORY_SIZE'] = 16 * 1024 * 1024  # 16MB for form data (handles base64 encoded images)
app.config['MAX_FORM_PARTS'] = 1000  # Maximum number of form parts

# Update session configuration
app.config.update(
    SESSION_COOKIE_SECURE=True,  # Set to True for HTTPS
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE='None',  # Allow cross-site cookies for different domains
    # SESSION_COOKIE_DOMAIN=None,  # Don't set domain to allow cookies on any domain
    PERMANENT_SESSION_LIFETIME=timedelta(days=30),  # Make sessions last 30 days
    SESSION_COOKIE_NAME='threads_session',
)

# CORS configuration for production
CORS(app, 
     supports_credentials=True,
     origins=[
         "https://localhost:5174",
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
# Set to '' for DigitalOcean production (DO strips /api)
# Set to '/api' for local development
API_PREFIX = ''  # Default: no prefix (production)

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
app.register_blueprint(create_ads_bp, url_prefix=API_PREFIX)

# Register API v1 blueprint (has its own prefix)
app.register_blueprint(post_api_bp)


if __name__ == '__main__':

    #LOCALHOST
    #app.run(host='0.0.0.0', port=5001,debug=True, ssl_context=('../https_certs/localhost+3.pem','../https_certs/localhost+3-key.pem'))

    #PRODUCTION
    app.run(host='0.0.0.0', port=5000, debug=False)







