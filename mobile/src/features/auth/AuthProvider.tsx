import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import type { AuthResponse, AuthUser } from './types';

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (result: AuthResponse) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = 'trimly.auth';

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{ token: string | null; user: AuthUser | null }>({
    token: null,
    user: null,
  });
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const savedSession = await SecureStore.getItemAsync(storageKey);
        if (!savedSession) return;

        const session = JSON.parse(savedSession) as {
          token?: string;
          user?: AuthUser;
        };

        if (session.token && session.user) {
          setState({ token: session.token, user: session.user });
        } else {
          await SecureStore.deleteItemAsync(storageKey);
        }
      } catch {
        await SecureStore.deleteItemAsync(storageKey);
      } finally {
        setReady(true);
      }
    }

    void restoreSession();
  }, []);

  async function signIn(result: AuthResponse) {
    const nextSession = { token: result.accessToken, user: result.user };
    await SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession));
    setState(nextSession);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(storageKey);
    setState({ token: null, user: null });
  }

  return <AuthContext.Provider value={{ ...state, isReady, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  return context;
}
