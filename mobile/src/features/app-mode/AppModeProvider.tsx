import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';

export type AppMode = 'customer' | 'business';

type AppModeContextValue = {
  enterBusinessMode: (membershipId?: string) => Promise<void>;
  enterCustomerMode: () => Promise<void>;
  isReady: boolean;
  mode: AppMode;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);
const storageKeyPrefix = 'trimly.app.mode.';

export function AppModeProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const {
    activeMembership,
    isReady: isBusinessReady,
    memberships,
    selectMembership,
  } = useBusiness();
  const userId = user?.id ?? null;
  const [requestedMode, setRequestedMode] = useState<AppMode>('customer');
  const [resolvedUserId, setResolvedUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    if (!isBusinessReady || resolvedUserId === userId) return;

    async function restoreMode() {
      if (!user) {
        setRequestedMode('customer');
        setResolvedUserId(null);
        return;
      }

      const storageKey = getStorageKey(user.id);

      try {
        const savedMode = await SecureStore.getItemAsync(storageKey);
        const nextMode: AppMode =
          savedMode === 'business' && activeMembership ? 'business' : 'customer';

        if (!isMounted) return;
        setRequestedMode(nextMode);

        if (savedMode !== nextMode) {
          await SecureStore.setItemAsync(storageKey, nextMode);
        }
      } catch {
        if (isMounted) setRequestedMode('customer');
      } finally {
        if (isMounted) setResolvedUserId(user.id);
      }
    }

    void restoreMode();

    return () => {
      isMounted = false;
    };
  }, [activeMembership, isBusinessReady, resolvedUserId, user, userId]);

  useEffect(() => {
    if (!isBusinessReady || resolvedUserId !== userId) return;
    if (requestedMode !== 'business' || activeMembership) return;

    let isMounted = true;

    async function leaveUnavailableBusinessMode() {
      if (user) {
        await SecureStore.setItemAsync(getStorageKey(user.id), 'customer').catch(() => undefined);
      }
      if (isMounted) setRequestedMode('customer');
    }

    void leaveUnavailableBusinessMode();

    return () => {
      isMounted = false;
    };
  }, [activeMembership, isBusinessReady, requestedMode, resolvedUserId, user, userId]);

  const mode: AppMode =
    requestedMode === 'business' && activeMembership ? 'business' : 'customer';
  const isReady = isBusinessReady && resolvedUserId === userId;

  async function enterBusinessMode(membershipId?: string) {
    if (!user) throw new Error('İşletme moduna geçmek için giriş yapmalısın.');

    const targetMembershipId = membershipId ?? activeMembership?.id;
    const targetMembership = memberships.find(
      (membership) => membership.id === targetMembershipId,
    );

    if (!targetMembership) {
      throw new Error('İşletme moduna geçmek için aktif bir işletme seçmelisin.');
    }

    if (activeMembership?.id !== targetMembership.id) {
      await selectMembership(targetMembership.id);
    }

    await SecureStore.setItemAsync(getStorageKey(user.id), 'business');
    setRequestedMode('business');
  }

  async function enterCustomerMode() {
    if (user) await SecureStore.setItemAsync(getStorageKey(user.id), 'customer');
    setRequestedMode('customer');
  }

  return (
    <AppModeContext.Provider value={{ enterBusinessMode, enterCustomerMode, isReady, mode }}>
      {children}
    </AppModeContext.Provider>
  );
}

function getStorageKey(userId: string) {
  return `${storageKeyPrefix}${userId}`;
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) throw new Error('useAppMode AppModeProvider içinde kullanılmalı.');
  return context;
}
