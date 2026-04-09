-- =============================================================================
-- Postwand — migración inicial Supabase / PostgreSQL
-- Ejecutar en: Supabase Dashboard → SQL → New query
-- =============================================================================
--
-- NOTA IMPORTANTE (Flask / auth):
-- Este script crea la fila en public.users automáticamente al registrarse en
-- auth.users (Google o email). Tu backend también hace INSERT en public.users
-- tras sign_up / Google sign-in: o bien quitas esos INSERT y confías en el
-- trigger, o bien cambias el backend a .upsert(..., on_conflict='id') para no
-- fallar por clave duplicada.
--
-- NOTA (Celery / workers):
-- El worker usa el cliente anon sin JWT de usuario. Con RLS activo, las
-- consultas a scheduled_posts fallarían. Usa SUPABASE_SERVICE_ROLE_KEY en el
-- worker (cliente service_role) para tareas en segundo plano; el service_role
-- ignora RLS en Supabase.
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensión para UUID
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.users — perfil enlazado a auth.users
-- Campos pedidos: id, email, full_name, avatar_url
-- Extra: compatibilidad con el backend actual (name, trials, Stripe, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  -- El código Flask usa "name"; se rellena igual que full_name en el trigger
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  language TEXT,
  trial_expired BOOLEAN NOT NULL DEFAULT FALSE,
  subscription_active BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  subscription_id TEXT,
  subscription_status TEXT,
  plan TEXT,
  subscription_interval TEXT,
  current_period_end TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_stripe_customer ON public.users (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

COMMENT ON TABLE public.users IS 'Perfil de aplicación; id = auth.users.id';

-- ---------------------------------------------------------------------------
-- Función y trigger: nueva fila en public.users al crear auth.users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB;
  v_full TEXT;
  v_name TEXT;
  v_avatar TEXT;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  v_full := NULLIF(TRIM(COALESCE(meta->>'full_name', meta->>'name', '')), '');
  v_name := NULLIF(TRIM(COALESCE(meta->>'name', meta->>'full_name', '')), '');
  v_avatar := NULLIF(TRIM(COALESCE(meta->>'avatar_url', meta->>'picture', '')), '');

  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    name,
    created_at,
    updated_at,
    trial_ends_at,
    subscription_tier
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    v_full,
    v_avatar,
    COALESCE(v_name, v_full),
    NOW(),
    NOW(),
    NOW() + INTERVAL '90 days',
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    email       = EXCLUDED.email,
    full_name   = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.users.full_name),
    avatar_url  = COALESCE(NULLIF(EXCLUDED.avatar_url, ''), public.users.avatar_url),
    name        = COALESCE(NULLIF(EXCLUDED.name, ''), public.users.name),
    updated_at  = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Sincroniza auth.users → public.users (email, nombre, avatar, trial inicial)';

-- ---------------------------------------------------------------------------
-- token_usage
-- ---------------------------------------------------------------------------
CREATE TABLE public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  grok_tokens_used BIGINT NOT NULL DEFAULT 0,
  claude_tokens_used BIGINT NOT NULL DEFAULT 0,
  image_tokens_used BIGINT NOT NULL DEFAULT 0,
  grok_max_tokens BIGINT NOT NULL DEFAULT 5000000,
  claude_max_tokens BIGINT NOT NULL DEFAULT 0,
  image_max_tokens BIGINT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE INDEX idx_token_usage_user_id ON public.token_usage (user_id);

-- ---------------------------------------------------------------------------
-- scheduled_posts
-- ---------------------------------------------------------------------------
CREATE TABLE public.scheduled_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  account_id TEXT,
  post_type TEXT NOT NULL DEFAULT 'post',
  status TEXT NOT NULL DEFAULT 'scheduled',
  scheduled_time TIMESTAMPTZ,
  image_url JSONB,
  video_url TEXT,
  content TEXT,
  platform_data JSONB DEFAULT '{}'::JSONB,
  post_creation_id TEXT,
  access_token TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_posts_user_id ON public.scheduled_posts (user_id);
CREATE INDEX idx_scheduled_posts_status_time ON public.scheduled_posts (status, scheduled_time);

-- ---------------------------------------------------------------------------
-- background_task_post
-- ---------------------------------------------------------------------------
CREATE TABLE public.background_task_post (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  celery_task_id TEXT,
  results JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_background_task_post_user_id ON public.background_task_post (user_id);

-- ---------------------------------------------------------------------------
-- upload_tasks
-- ---------------------------------------------------------------------------
CREATE TABLE public.upload_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  platform TEXT,
  post_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_upload_tasks_user_id ON public.upload_tasks (user_id);

-- ---------------------------------------------------------------------------
-- facebook_auth
-- ---------------------------------------------------------------------------
CREATE TABLE public.facebook_auth (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  facebook_user_id TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, facebook_user_id)
);

CREATE INDEX idx_facebook_auth_user_id ON public.facebook_auth (user_id);

-- ---------------------------------------------------------------------------
-- updated_at automático (opcional pero útil)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_token_usage_updated_at
  BEFORE UPDATE ON public.token_usage
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_scheduled_posts_updated_at
  BEFORE UPDATE ON public.scheduled_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_background_task_post_updated_at
  BEFORE UPDATE ON public.background_task_post
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

CREATE TRIGGER tr_facebook_auth_updated_at
  BEFORE UPDATE ON public.facebook_auth
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — política: cada usuario solo sus filas (auth.uid() = user_id)
-- En public.users la clave es id = auth.uid()
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.background_task_post ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON public.users
  FOR ALL
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can only access their own data"
  ON public.token_usage
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data"
  ON public.scheduled_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data"
  ON public.background_task_post
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data"
  ON public.upload_tasks
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data"
  ON public.facebook_auth
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- STORAGE — bucket post-videos
-- ---------------------------------------------------------------------------
-- Opción A (recomendada): Dashboard → Storage → New bucket → nombre: post-videos
--   Marca "Public bucket" si las URLs deben ser públicas sin JWT.
--
-- Opción B (SQL): crea el bucket desde el editor SQL:
--
--   INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
--   VALUES (
--     'post-videos',
--     'post-videos',
--     true,
--     524288000,
--     ARRAY['video/mp4', 'video/webm', 'video/quicktime']::text[]
--   );
--
-- Políticas de storage (ejemplo mínimo si el bucket es privado): definir en
-- Storage → Policies o vía SQL sobre storage.objects según tu modelo de acceso.
-- =============================================================================
--
-- Tablas adicionales que usa el backend y no están en este script (siguiente migración):
--   - public.facebook_pages (vinculada a facebook_auth)
--   - public.verification_codes (verificación de email)
--   - instagram_accounts, youtube_channels, tiktok_accounts, linkedin_*, etc.
--
-- Si CREATE TRIGGER falla con EXECUTE FUNCTION, prueba:
--   EXECUTE PROCEDURE public.handle_new_user();
-- (PostgreSQL antiguo; Supabase actual suele aceptar EXECUTE FUNCTION.)
-- =============================================================================
