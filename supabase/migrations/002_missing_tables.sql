-- =============================================================================
-- Postwand — migration 002: missing tables + RPC functions
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- =============================================================================

-- brands
CREATE TABLE IF NOT EXISTS public.brands (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    domain text,
    name text,
    website_url text,
    logo_url text,
    colors jsonb DEFAULT '[]',
    brand_info jsonb DEFAULT '{}',
    products jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_brands_user_id ON public.brands(user_id);

-- instagram_accounts
CREATE TABLE IF NOT EXISTS public.instagram_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    access_token text,
    account_id text,
    name text,
    profile_picture text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_instagram_accounts_user_id ON public.instagram_accounts(user_id);

-- facebook_pages
CREATE TABLE IF NOT EXISTS public.facebook_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id uuid REFERENCES public.facebook_auth(id) ON DELETE CASCADE,
    account_id text,
    name text,
    access_token text,
    profile_picture text,
    created_at timestamptz DEFAULT now()
);

-- linkedin_accounts
CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id text,
    access_token text,
    refresh_token text,
    token_expires_in bigint,
    scope text,
    urn text,
    identifier text,
    email text,
    name text,
    profile_picture text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_linkedin_accounts_user_id ON public.linkedin_accounts(user_id);

-- youtube_channels
CREATE TABLE IF NOT EXISTS public.youtube_channels (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id text,
    access_token text,
    refresh_token text,
    name text,
    description text,
    profile_picture text,
    custom_url text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_youtube_channels_user_id ON public.youtube_channels(user_id);

-- tiktok_accounts
CREATE TABLE IF NOT EXISTS public.tiktok_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id text,
    access_token text,
    refresh_token text,
    expires_in bigint,
    scope text,
    username text,
    name text,
    profile_picture text,
    created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tiktok_accounts_user_id ON public.tiktok_accounts(user_id);

-- threads_auth
CREATE TABLE IF NOT EXISTS public.threads_auth (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    access_token text,
    created_at timestamptz DEFAULT now()
);

-- threads_accounts
CREATE TABLE IF NOT EXISTS public.threads_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_id uuid REFERENCES public.threads_auth(id) ON DELETE CASCADE,
    account_id text,
    name text,
    profile_picture text,
    created_at timestamptz DEFAULT now()
);

-- verification_codes
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    email text,
    code text,
    expires_at timestamptz,
    attempts int DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- RPC functions for token usage
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_over_grok_limit(user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        (SELECT t.grok_tokens_used >= t.grok_max_tokens
         FROM public.token_usage t WHERE t.user_id = is_over_grok_limit.user_id),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.add_grok_tokens(user_id uuid, tokens bigint)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE public.token_usage
    SET grok_tokens_used = grok_tokens_used + add_grok_tokens.tokens
    WHERE token_usage.user_id = add_grok_tokens.user_id;
$$;

CREATE OR REPLACE FUNCTION public.is_over_image_limit(user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
    SELECT COALESCE(
        (SELECT t.image_tokens_used >= t.image_max_tokens
         FROM public.token_usage t WHERE t.user_id = is_over_image_limit.user_id),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.add_image_tokens(user_id uuid, tokens bigint)
RETURNS void
LANGUAGE sql
AS $$
    UPDATE public.token_usage
    SET image_tokens_used = image_tokens_used + add_image_tokens.tokens
    WHERE token_usage.user_id = add_image_tokens.user_id;
$$;

-- =============================================================================
-- RLS policies for new tables
-- =============================================================================

ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instagram_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tiktok_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_brands" ON public.brands FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_instagram" ON public.instagram_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_linkedin" ON public.linkedin_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_youtube" ON public.youtube_channels FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_tiktok" ON public.tiktok_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_threads_auth" ON public.threads_auth FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- Initialize token_usage for existing users without a row
-- =============================================================================
INSERT INTO public.token_usage (user_id, grok_tokens_used, claude_tokens_used, image_tokens_used, grok_max_tokens, claude_max_tokens, image_max_tokens)
SELECT u.id, 0, 0, 0, 5000000, 0, 5
FROM public.users u
LEFT JOIN public.token_usage t ON t.user_id = u.id
WHERE t.user_id IS NULL;
