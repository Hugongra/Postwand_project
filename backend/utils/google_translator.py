from google.cloud import translate_v3 as translate
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class GoogleTranslator:
    def __init__(self):
        # Get credentials path from environment variable
        credentials_path = os.getenv('GOOGLE_TRANSLATOR_CREDENTIALS')
        
        if credentials_path:
            # If path is relative, convert to absolute based on project root
            if not os.path.isabs(credentials_path):
                # Assuming backend/ is the directory where app.py runs from
                base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                credentials_path = os.path.join(base_dir, credentials_path)
                
            # Set the environment variable Google's client library uses
            os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
            print(f"Using translator credentials from: {credentials_path}")
            
        try:
            # Initialize Translation client with v3
            self.client = translate.TranslationServiceClient()
            self.enabled = True
            print("Google Translation initialized successfully")
        except Exception as e:
            print(f"Google Translation initialization error: {e}")
            self.enabled = False
        
    @lru_cache(maxsize=100)
    def translate(self, text, target_language='en'):
        """Translate text using Google Translate API"""
        if not text or target_language == 'en' or not self.enabled:
            return text
            
        try:
            # Get project ID from environment variable
            project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
            
            if not project_id:
                print("Google Cloud project ID not set. Translation disabled.")
                return text
                
            # The location of the translation service
            location = "global"
            
            # Parent resource path
            parent = f"projects/{project_id}/locations/{location}"
            
            # Call the Translation API
            response = self.client.translate_text(
                request={
                    "parent": parent,
                    "contents": [text],
                    "mime_type": "text/plain",
                    "source_language_code": "en",
                    "target_language_code": target_language,
                }
            )
            
            # Extract the translation from the response
            return response.translations[0].translated_text
        except Exception as e:
            print(f"Google Translation error: {e}")
            return text  # Fallback to original text

# Create a singleton instance
translator = GoogleTranslator() 