-- Zernio profile mapping: each user gets one Zernio profile
CREATE TABLE IF NOT EXISTS public.zernio_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    zernio_profile_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.zernio_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own zernio profile"
    ON public.zernio_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access zernio_profiles"
    ON public.zernio_profiles FOR ALL
    USING (true)
    WITH CHECK (true);
