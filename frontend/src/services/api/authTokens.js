import { getSupabaseBrowserClient } from '@services/supabase/client'

const ACCESS_KEY = 'postwand_access_token'
const REFRESH_KEY = 'postwand_refresh_token'

export function setAuthTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY)
}

export function clearAuthTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

/** Guarda tokens del backend y sincroniza la sesión del cliente Supabase browser. */
export async function persistSessionFromApiResponse(data) {
  if (!data || typeof data !== 'object') return
  const at = data.access_token
  const rt = data.refresh_token
  if (at) localStorage.setItem(ACCESS_KEY, at)
  if (rt) localStorage.setItem(REFRESH_KEY, rt)

  const client = getSupabaseBrowserClient()
  if (client && at && rt) {
    try {
      const { error } = await client.auth.setSession({
        access_token: at,
        refresh_token: rt,
      })
      if (error) {
        console.error('[auth] setSession error:', error.message)
      } else if (import.meta.env.DEV) {
        console.info('[auth] Supabase browser session synced OK')
      }
    } catch (e) {
      console.error('[auth] setSession exception:', e)
    }
  } else if (at && !rt) {
    if (import.meta.env.DEV) {
      console.warn(
        '[auth] Backend returned access_token but no refresh_token; Supabase session not set'
      )
    }
  }
}

/**
 * Token en todas las peticiones API (no solo login): primero sesión Supabase, luego localStorage.
 * Misma forma que la API JS oficial: getSession() → data.session.access_token
 */
export async function getAuthorizationHeaderAsync() {
  const client = getSupabaseBrowserClient()
  let session = null
  if (client) {
    const sessionResult = await client.auth.getSession()
    session = sessionResult?.data?.session ?? null
    const accessToken = session?.access_token
    if (accessToken) {
      return { Authorization: `Bearer ${accessToken}` }
    }
  }
  const fromStorage = getAuthorizationHeader()
  if (import.meta.env.DEV && !fromStorage.Authorization) {
    console.warn(
      '[auth] getAuthorizationHeaderAsync: sin token (supabase session=',
      !!session?.access_token,
      ' localStorage access=',
      !!getAccessToken(),
      ') — revisa que VITE_SUPABASE_URL / ANON coincidan con el backend'
    )
  }
  return fromStorage
}

export function getAuthorizationHeader() {
  const t = getAccessToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}
