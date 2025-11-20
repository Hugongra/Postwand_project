# celery_worker.py
import os
import sys
import logging
from dotenv import load_dotenv
import gevent.monkey
gevent.monkey.patch_all()

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

from celery_config import celery_app
from services.scheduler.process_posts import process_scheduled_posts, run_in_background_task


sys.argv = [
    'worker',
    '--loglevel=info',
    '-E',
    '--pool=gevent',
    '--concurrency=2',
    '--task-events',
    '-Q', 'background_tasks',  
]

if __name__ == '__main__':

    celery_app.worker_main(sys.argv)
