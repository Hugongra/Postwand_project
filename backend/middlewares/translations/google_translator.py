from google.cloud import translate_v3 as translate
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class GoogleTranslator:
    def __init__(self):
        credentials_path = os.getenv('GOOGLE_TRANSLATOR_CREDENTIALS')
        
        if credentials_path:
            if not os.path.isabs(credentials_path):
                # Get the directory where this file (google_translator.py) is located
                base_dir = os.path.dirname(os.path.abspath(__file__))
                credentials_path = os.path.join(base_dir, credentials_path)
            
            # Check if file exists before setting
            if os.path.exists(credentials_path):
                os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
                print(f"Google Translation credentials loaded from: {credentials_path}")
            else:
                print(f"Google Translation initialization error: File {credentials_path} was not found.")
                self.enabled = False
                return
            
        try:
            self.client = translate.TranslationServiceClient()
            self.enabled = True
        except Exception as e:
            print(f"Google Translation initialization error: {e}")
            self.enabled = False
        
    @lru_cache(maxsize=100)
    def translate(self, text, target_language='en'):
        
        if not text or target_language == 'en' or not self.enabled: return text
            
        try:
            project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
            if not project_id: return text
                
            location = "global"
            parent = f"projects/{project_id}/locations/{location}"
            
            response = self.client.translate_text(
                request={
                    "parent": parent,
                    "contents": [text],
                    "mime_type": "text/plain",
                    "source_language_code": "en",
                    "target_language_code": target_language,
                }
            )
            
            return response.translations[0].translated_text
        except Exception as e:
            print(f"Google Translation error: {e}")
            return text  

translator = GoogleTranslator() 