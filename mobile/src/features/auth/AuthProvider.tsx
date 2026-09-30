import * as SecureStore from 'expo-secure-store';
import type { Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError, clearApiCache } from '@/lib/api/client';
import { getCurrentUser } from './api';
import type { AuthResponse, AuthUser } from './types';

type PersistedAuthUser = Omit<AuthUser, 'businessMemberships'> & {
  businessMemberships?: AuthUser['businessMemberships'];
};

type AuthTransition = 'signing-in' | 'signing-out';

type AuthContextValue = {
  authTransition: AuthTransition | null;
  finishAuthTransition: () => void;
  isReady: boolean;
  isAuthTransitioning: boolean;
  postAuthRoute: Href | null;
  token: string | null;
  user: AuthUser | null;
  clearPostAuthRoute: () => void;
  signIn: (
    result: AuthResponse,
    rememberMe?: boolean,
    postAuthRoute?: Href,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  updateUser: (user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const storageKey = 'trimly.auth';
const authTransitionCoverMs = 180;

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{
    token: string | null;
    user: AuthUser | null;
  }>({
    token: null,
    user: null,
  });
  const [isReady, setReady] = useState(false);
  const [authTransition, setAuthTransition] = useState<AuthTransition | null>(
    null,
  );
  const [postAuthRoute, setPostAuthRoute] = useState<Href | null>(null);
  const clearPostAuthRoute = useCallback(() => setPostAuthRoute(null), []);
  const finishAuthTransition = useCallback(() => setAuthTransition(null), []);
  const isAuthTransitioning = authTransition !== null;

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const savedSession = await SecureStore.getItemAsync(storageKey);
        if (!savedSession) return;

        const session = JSON.parse(savedSession) as {
          token?: string;
          user?: PersistedAuthUser;
        };

        if (session.token && session.user) {
          if (!isActive) return;

          const restoredSession = {
            token: session.token,
            user: normalizeUser(session.user),
          };
          setState(restoredSession);
          setReady(true);

          try {
            const currentUser = await getCurrentUser(session.token);
            if (!isActive) return;

            const refreshedSession = {
              token: session.token,
              user: currentUser,
            };
            setState(refreshedSession);
            await SecureStore.setItemAsync(
              storageKey,
              JSON.stringify(refreshedSession),
            );
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

  async function signIn(
    result: AuthResponse,
    rememberMe = true,
    nextRoute: Href = '/',
  ) {
    clearApiCache();
    const nextSession = {
      token: result.accessToken,
      user: normalizeUser(result.user),
    };
    setPostAuthRoute(nextRoute);
    setAuthTransition('signing-in');

    const storageOperation = rememberMe
      ? SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession))
      : SecureStore.deleteItemAsync(storageKey);

    await wait(authTransitionCoverMs);

    // RootNavigator consumes this only after all user-dependent providers are
    // ready, avoiding a race between protected routes and storage operations.
    setState(nextSession);
    await storageOperation.catch(() => undefined);
  }

  async function signOut() {
    clearApiCache();
    setPostAuthRoute(null);
    setAuthTransition('signing-out');
    const storageOperation = SecureStore.deleteItemAsync(storageKey);
    await wait(authTransitionCoverMs);
    setState({ token: null, user: null });
    await storageOperation.catch(() => undefined);
  }

  async function updateUser(user: AuthUser) {
    const nextSession = { token: state.token, user: normalizeUser(user) };
    setState(nextSession);

    const savedSession = await SecureStore.getItemAsync(storageKey);
    if (savedSession && state.token) {
      await SecureStore.setItemAsync(storageKey, JSON.stringify(nextSession));
    }
  }

  async function refreshUser() {
    if (!state.token) return null;

    const currentUser = await getCurrentUser(state.token);
    await updateUser(currentUser);
    return currentUser;
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        authTransition,
        clearPostAuthRoute,
        finishAuthTransition,
        isAuthTransitioning,
        isReady,
        postAuthRoute,
        refreshUser,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function normalizeUser(user: PersistedAuthUser): AuthUser {
  return {
    ...user,
    birthDate: user.birthDate ?? null,
    provinceCode: user.provinceCode ?? null,
    province: user.province ?? null,
    district: user.district ?? null,
    neighborhood: user.neighborhood ?? null,
    businessMemberships: user.businessMemberships ?? [],
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalı.');
  return context;
}
