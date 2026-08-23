import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import type { AuthResponse, AuthUser } from './types';

type AuthContextValue = { isReady: boolean; token: string | null; user: AuthUser | null; signIn: (result: AuthResponse) => Promise<void>; signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);
const key = 'trimly.auth';
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<{ token: string | null; user: AuthUser | null }>({ token: null, user: null });
  const [isReady, setReady] = useState(false);
  useEffect(() => { void SecureStore.getItemAsync(key).then((saved) => { if (saved) setState(JSON.parse(saved)); }).finally(() => setReady(true)); }, []);
  async function signIn(result: AuthResponse) { const next = { token: result.accessToken, user: result.user }; await SecureStore.setItemAsync(key, JSON.stringify(next)); setState(next); }
  async function signOut() { await SecureStore.deleteItemAsync(key); setState({ token: null, user: null }); }
  return <AuthContext.Provider value={{ ...state, isReady, signIn, signOut }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error('useAuth AuthProvider içinde kullanılmalı.'); return context; }
