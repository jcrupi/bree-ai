/**
 * AppModeContext — global Mock / Live toggle + auth state
 * Persisted to sessionStorage so it survives tab switches but resets on window close.
 */
import React, { createContext, useContext, useState, useCallback } from 'react';

export type AppMode = 'mock' | 'live';

/** True when running via local Docker / dev server */
export const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname === '0.0.0.0');

interface AuthState {
  accessToken: string;
  instanceUrl: string;
}

interface AppModeContextValue {
  mode:       AppMode;
  setMode:    (m: AppMode) => void;
  isLive:     boolean;
  isMock:     boolean;
  auth:       AuthState | null;
  setAuth:    (a: AuthState | null) => void;
}

const AppModeContext = createContext<AppModeContextValue>({
  mode:    'mock',
  setMode: () => {},
  isLive:  false,
  isMock:  true,
  auth:    null,
  setAuth: () => {},
});

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const isDockerProd = import.meta.env.PROD;

  const [mode, setModeState] = useState<AppMode>(() => {
    if (!isDockerProd) return 'mock';
    return (sessionStorage.getItem('appMode') as AppMode) ?? 'mock';
  });

  const [auth, setAuthState] = useState<AuthState | null>(null);

  const setMode = useCallback((m: AppMode) => {
    if (!isDockerProd) {
      setModeState('mock');
      return;
    }
    sessionStorage.setItem('appMode', m);
    setModeState(m);
    // Clear auth when switching back to mock
    if (m === 'mock') setAuthState(null);
  }, [isDockerProd]);

  const setAuth = useCallback((a: AuthState | null) => {
    setAuthState(a);
  }, []);

  return (
    <AppModeContext.Provider value={{
      mode, setMode,
      isLive: mode === 'live',
      isMock: mode === 'mock',
      auth,
      setAuth,
    }}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  return useContext(AppModeContext);
}
