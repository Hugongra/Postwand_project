import requests
import base64

def download_and_encode_image(url):
    try:
        response = requests.get(url)
        if response.status_code == 200:
            image_data = base64.b64encode(response.content).decode('utf-8')
            return f"data:image/{response.headers['Content-Type'].split('/')[-1]};base64,{image_data}"
        return None
    except Exception:
        return None
    
    