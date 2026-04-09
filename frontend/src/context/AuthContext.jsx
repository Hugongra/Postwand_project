import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { getSupabaseBrowserClient } from '@services/supabase/client';
import { getAccessToken } from '@services/api/authTokens';

const AuthContext = createContext(null);

/**
 * Evita que la primera pintura trate al usuario como deslogueado antes de que
 * Supabase/localStorage terminen de hidratar la sesión (causa redirects a /login).
 */
export function AuthProvider({ children }) {
  const { i18n } = useTranslation();
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const applyUserFromStorage = useCallback(() => {
    const raw = localStorage.getItem('user');
    const userData = raw ? JSON.parse(raw) : null;
    setUser(userData);
    setIsLoggedIn(!!userData);
    return userData;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supa = getSupabaseBrowserClient();
        if (supa) {
          const sessionRes = await supa.auth.getSession();
          const session = sessionRes?.data?.session ?? null;

          if (session?.user && !localStorage.getItem('user')) {
            const u = session.user;
            const minimal = {
              id: u.id,
              email: u.email || '',
              name:
                (u.user_metadata &&
                  (u.user_metadata.name || u.user_metadata.full_name)) ||
                '',
              has_access: true,
            };
            localStorage.setItem('user', JSON.stringify(minimal));
            if (import.meta.env.DEV) {
              console.info(
                '[auth] Restored user from Supabase session (localStorage user was missing)'
              );
            }
          }
        } else if (getAccessToken() && !localStorage.getItem('user')) {
          if (import.meta.env.DEV) {
            console.warn(
              '[auth] Tokens in localStorage but no user object; sign in again or clear storage'
            );
          }
        }
      } catch (e) {
        if (import.meta.env.DEV) {
          console.warn('[auth] Bootstrap getSession failed', e);
        }
      }

      if (cancelled) return;

      const userData = applyUserFromStorage();
      if (userData?.language) {
        i18n.changeLanguage(userData.language);
      }
      setAuthReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [applyUserFromStorage, i18n]);

  useEffect(() => {
    if (!authReady) return;
    const onAuthEvent = () => {
      const userData = applyUserFromStorage();
      if (userData?.language) {
        i18n.changeLanguage(userData.language);
      }
    };
    window.addEventListener('user_logged_in', onAuthEvent);
    window.addEventListener('user_logged_out', onAuthEvent);
    return () => {
      window.removeEventListener('user_logged_in', onAuthEvent);
      window.removeEventListener('user_logged_out', onAuthEvent);
    };
  }, [authReady, applyUserFromStorage, i18n]);

  const value = useMemo(
    () => ({
      authReady,
      user,
      setUser,
      isLoggedIn,
      setIsLoggedIn,
      applyUserFromStorage,
    }),
    [authReady, user, isLoggedIn, applyUserFromStorage]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
