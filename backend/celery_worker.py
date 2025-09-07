# celery_worker.py
import os
import sys
import logging
from dotenv import load_dotenv
import gevent.monkey
gevent.monkey.patch_all()
# Configure logging - reduce verbosity for production
logging.basicConfig(level=logging.INFO)

# Load .env file
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

print(f"Redis Host: {os.environ.get('UPSTASH_REDIS_HOST')}")
print(f"Redis Port: {os.environ.get('UPSTASH_REDIS_PORT')}")
print(f"Redis Password present: {'Yes' if os.environ.get('UPSTASH_REDIS_PASSWORD') else 'No'}")

# Import your configured Celery app
from scheduler.scheduler import celery_app, process_scheduled_posts, run_in_background_task

# We need to explicitly import the task modules so the worker knows about them
# Just importing the function is enough to register it with Celery

# Run the worker process (without beat)
sys.argv = [
    'worker',
    '--loglevel=info',  # Reduce from debug to info
    '-E',
    '--pool=gevent',
    '--concurrency=2',
    '--task-events',
]

if __name__ == '__main__':
    celery_app.worker_main(sys.argv)
