"""
Supabase client with SERVICE_ROLE_KEY.

Usar en Celery, process_scheduled_posts, publicación en background y cualquier
consulta servidor-a-BD que deba ver datos de todos los usuarios. Ignora RLS.

Nunca exponer esta clave al frontend ni a Vite.
"""
from database import get_service_role_client

supabase_service = get_service_role_client()
