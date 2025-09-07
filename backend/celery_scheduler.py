# celery_scheduler.py - For Digital Ocean App Platform
import os
import sys
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Load .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

print(f"Redis Host: {os.environ.get('UPSTASH_REDIS_HOST')}")
print(f"Redis Port: {os.environ.get('UPSTASH_REDIS_PORT')}")
print(f"Redis Password present: {'Yes' if os.environ.get('UPSTASH_REDIS_PASSWORD') else 'No'}")

# Import your configured Celery app
from scheduler.scheduler import celery_app, process_scheduled_posts

# Ensure the task is registered by importing it explicitly
# This is critical - we need to import the actual task function

# Define your Celery beat schedule
celery_app.conf.beat_schedule = {
    'check-scheduled-posts': {
        'task': 'scheduler.scheduler.process_scheduled_posts',
        'schedule': 30,  # Run every 30 seconds
    },
}

if __name__ == '__main__':
    print("Starting Celery Beat scheduler...")
    
    sys.argv = [
        'beat',
        '--loglevel=debug',
    ]
    celery_app.start(sys.argv) 