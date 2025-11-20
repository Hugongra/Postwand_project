import os
from celery import Celery

UPSTASH_REDIS_HOST = os.getenv("UPSTASH_REDIS_HOST")
UPSTASH_REDIS_PORT = os.getenv("UPSTASH_REDIS_PORT")
UPSTASH_REDIS_PASSWORD = os.getenv("UPSTASH_REDIS_PASSWORD")

redis_url = f"rediss://:{UPSTASH_REDIS_PASSWORD}@{UPSTASH_REDIS_HOST}:{UPSTASH_REDIS_PORT}?ssl_cert_reqs=required"

celery_app = Celery('scheduler',
                   broker=redis_url,
                   backend=redis_url)

# Configure elery
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    broker_connection_retry_on_startup=True,
    task_routes={
        'scheduler.scheduler.process_scheduled_posts': {'queue': 'scheduler'},
        'scheduler.scheduler.run_in_background_task': {'queue': 'background_tasks'},
    },
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)

celery_app.autodiscover_tasks(['services.scheduler'])
