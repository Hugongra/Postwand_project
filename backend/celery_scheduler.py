import os
import sys
import logging
from dotenv import load_dotenv

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from celery_config import celery_app
from services.scheduler.process_posts import process_scheduled_posts

celery_app.conf.beat_schedule = {
    'check-scheduled-posts': {
        'task': 'scheduler.scheduler.process_scheduled_posts',
        'schedule': 30,  
    },
}
if __name__ == '__main__':
   
    sys.argv = [
        'beat',
        '--loglevel=info',
    ]
    celery_app.start(sys.argv) 