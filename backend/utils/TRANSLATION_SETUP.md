# Setting Up Google Cloud Translation API

To use the automatic translation feature in your backend, follow these steps:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project

## 2. Enable the Cloud Translation API

1. In your Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Cloud Translation API"
3. Click on it and click "Enable"

## 3. Create a Service Account

1. Go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name like "translation-service"
4. Grant the role "Cloud Translation API User" to this service account
5. Click "Done"

## 4. Create and Download a Service Account Key

1. Find your service account in the list
2. Click the three dots menu and select "Manage keys"
3. Click "Add Key" > "Create new key"
4. Select JSON format and click "Create"
5. The key file will download automatically

## 5. Set Up Environment Variables

Option 1: Set the environment variable to point to your key file:

```bash
# Linux/macOS
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your-service-account-key.json"

# Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS="C:\path\to\your-service-account-key.json"
```

Option 2: Place the key file in your project and update the GoogleTranslator class:

```python
# In backend/utils/google_translator.py
def __init__(self):
    # Point to your key file
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.path.join(
        os.path.dirname(os.path.dirname(__file__)), 
        'your-service-account-key.json'
    )
    try:
        self.client = translate.Client()
        self.enabled = True
    except Exception as e:
        print(f"Google Translation initialization error: {e}")
        self.enabled = False
```

## 6. Testing the Translation

1. Start your Flask app
2. Make a request to the test endpoint with different Accept-Language headers:

```bash
# Test with Spanish
curl -H "Accept-Language: es" http://localhost:5000/api/test-translation

# Test with French
curl -H "Accept-Language: fr" http://localhost:5000/api/test-translation
```

You can also test by passing a language parameter:

```
http://localhost:5000/api/test-translation?lang=es
```

## Notes

- The translation service uses caching to reduce API calls for repeated messages
- If you don't set up the Google Cloud credentials, the system will fall back to using the original messages
- You can disable translation by setting `self.enabled = False` in the GoogleTranslator class 