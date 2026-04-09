import { createClient } from '@supabase/supabase-js'

let singleton = null

/**
 * Cliente browser con ANON_KEY (Vite).
 * Requiere en .env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
 *
 * Para que las políticas RLS de Storage (auth.uid() = carpeta) funcionen,
 * después del login debes asociar la sesión de Supabase Auth, p. ej.:
 *   const s = getSupabaseBrowserClient()
 *   await s.auth.setSession({ access_token, refresh_token })
 * (tokens que devuelve tu backend tras login con Supabase.)
 */
export function getSupabaseBrowserClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return null
  }
  if (!singleton) {
    singleton = createClient(url, anonKey)
  }
  return singleton
}
