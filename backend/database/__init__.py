import os
from functools import lru_cache
from supabase import create_client, Client, ClientOptions


def _supabase_url() -> str:
    url = (os.getenv("SUPABASE_URL") or "").strip()
    if not url:
        raise ValueError("SUPABASE_URL must be set")
    return url


def get_supabase_anon_key() -> str:
    """
    Anon / public key from Supabase Dashboard → API.
    Used for create_client + auth.get_user(jwt). Must NOT be the service_role key.
    Prefer SUPABASE_ANON_KEY; fall back to SUPABASE_KEY for backwards compatibility.
    """
    key = (os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY") or "").strip()
    if not key:
        raise ValueError(
            "Set SUPABASE_ANON_KEY or SUPABASE_KEY to the project's anon (public) key"
        )
    sr = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if sr and key == sr:
        raise ValueError(
            "SUPABASE_ANON_KEY / SUPABASE_KEY is identical to SUPABASE_SERVICE_ROLE_KEY; "
            "use the anon public key for the app client, not the service_role secret."
        )
    return key


@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Cached client with the anon key (GoTrue + PostgREST as anon role)."""
    return create_client(_supabase_url(), get_supabase_anon_key())


@lru_cache(maxsize=1)
def get_service_role_client() -> Client:
    """Cached client with service_role (admin, Celery, triggers) — never use for get_user(user_jwt)."""
    key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not key:
        raise ValueError("SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(_supabase_url(), key)


def get_supabase_client_with_access_token(access_token: str) -> Client:
    """
    PostgREST + Storage use the end-user JWT so RLS (auth.uid()) matches the caller.
    Do not cache: one client instance per request/token.
    """
    token = (access_token or "").strip()
    if not token:
        raise ValueError("access_token is required")
    opts = ClientOptions()
    opts.headers["Authorization"] = f"Bearer {token}"
    return create_client(_supabase_url(), get_supabase_anon_key(), opts)


def get_supabase_client_for_request():
    """
    Prefer the access token set by @login_required (Bearer or Flask session).
    Falls back to the anon singleton if missing (legacy / edge cases).
    """
    from flask import g

    token = getattr(g, "supabase_access_token", None)
    if token:
        return get_supabase_client_with_access_token(token)
    return get_supabase_client()
