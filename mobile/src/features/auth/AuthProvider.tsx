import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { ApiError } from '@/lib/api/client';
import { getCurrentUser } from './api';
import type { AuthResponse, AuthUser } from './types';

type AuthContextValue = {
  isReady: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: (result: AuthResponse, rememberMe?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
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
    let isActive = true;

    async function restoreSession() {
      try {
        const savedSession = await SecureStore.getItemAsync(storageKey);
        if (!savedSession) return;

        const session = JSON.parse(savedSession) as {
          token?: string;
          user?: AuthUser;
        };

        if (session.token && session.user) {
          if (!isActive) return;

          const restoredSession = { token: session.token, user: session.user };
          setState(restoredSession);
          setReady(true);

          try {
            const currentUser = await getCurrentUser(session.token);
            if (!isActive) return;

            const refreshedSession = { token: session.token, user: currentUser };
            setState(refreshedSession);
            await SecureStore.setItemAsync(storageKey, JSON.stringify(refreshedSession));
          } catch (reason) {
            if (reason instanceof ApiError && reason.status === 401) {
              await SecureStore.deleteItemAsync(storageKey);
              if (isActive) setState({ token: null, user: null });
            }
          }
        } else {
          await SecureStore.deleteItemAsync(storageKey);
        }
      } catch {
        await SecureStore.deleteItemAsync(storageKey);
      } finally {
        if (isActive) setReady(true);
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  async function signIn(result: AuthResponse, rememberMe = true) {
    const nextSession = { token: result.accessToken, user: result.user };

    if (rememberMe) {
      await SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession));
    } else {
      await SecureStore.deleteItemAsync(storageKey);
    }

    setState(nextSession);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(storageKey);
    setState({ token: null, user: null });
  }

  async function updateUser(user: AuthUser) {
    const nextSession = { token: state.token, user };
    setState(nextSession);

    const savedSession = await SecureStore.getItemAsync(storageKey);
    if (savedSession && state.token) {
      await SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession));
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, isReady, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  return context;
}
