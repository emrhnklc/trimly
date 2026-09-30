import * as SecureStore from 'expo-secure-store';
import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';

export type AppMode = 'customer' | 'business';
export type StartupProfile = 'last_used' | 'customer' | `business:${string}`;

type AppModeContextValue = {
  enterBusinessMode: (membershipId?: string) => Promise<void>;
  enterCustomerMode: () => Promise<void>;
  isReady: boolean;
  mode: AppMode;
  setStartupProfile: (profile: StartupProfile) => Promise<void>;
  startupProfile: StartupProfile;
};

const AppModeContext = createContext<AppModeContextValue | null>(null);
const storageKeyPrefix = 'trimly.app.mode.';
const startupStorageKeyPrefix = 'trimly.app.startup-profile.';

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
  const [startupProfile, setStartupProfileState] = useState<StartupProfile>('last_used');
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
        const [savedMode, savedStartupProfile] = await Promise.all([
          SecureStore.getItemAsync(storageKey),
          SecureStore.getItemAsync(getStartupStorageKey(user.id)),
        ]);
        const validBusinessPreference = savedStartupProfile?.startsWith('business:')
          ? memberships.find((membership) => membership.id === savedStartupProfile.slice('business:'.length))
          : null;
        const nextStartupProfile: StartupProfile = savedStartupProfile === 'customer'
          ? 'customer'
          : validBusinessPreference
            ? `business:${validBusinessPreference.id}`
            : 'last_used';
        let nextMode: AppMode;
        if (nextStartupProfile === 'customer') {
          nextMode = 'customer';
        } else if (validBusinessPreference) {
          if (activeMembership?.id !== validBusinessPreference.id) {
            await selectMembership(validBusinessPreference.id);
          }
          nextMode = 'business';
        } else {
          nextMode = savedMode === 'business' && activeMembership ? 'business' : 'customer';
        }

        if (!isMounted) return;
        setStartupProfileState(nextStartupProfile);
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
  }, [activeMembership, isBusinessReady, memberships, resolvedUserId, selectMembership, user, userId]);

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
    if (!targetMembershipId) {
      throw new Error('İşletme moduna geçmek için aktif bir işletme seçmelisin.');
    }

    if (activeMembership?.id !== targetMembershipId) {
      await selectMembership(targetMembershipId);
    }

    await SecureStore.setItemAsync(getStorageKey(user.id), 'business');
    setRequestedMode('business');
  }

  async function enterCustomerMode() {
    if (user) await SecureStore.setItemAsync(getStorageKey(user.id), 'customer');
    setRequestedMode('customer');
  }

  async function setStartupProfile(profile: StartupProfile) {
    if (!user) throw new Error('Açılış profilini seçmek için giriş yapmalısın.');
    if (profile.startsWith('business:')) {
      const membershipId = profile.slice('business:'.length);
      if (!memberships.some((membership) => membership.id === membershipId)) {
        throw new Error('Seçilen işletme profili artık kullanılamıyor.');
      }
    }
    await SecureStore.setItemAsync(getStartupStorageKey(user.id), profile);
    setStartupProfileState(profile);
  }

  return (
    <AppModeContext.Provider value={{ enterBusinessMode, enterCustomerMode, isReady, mode, setStartupProfile, startupProfile }}>
      {children}
    </AppModeContext.Provider>
  );
}

function getStorageKey(userId: string) {
  return `${storageKeyPrefix}${userId}`;
}

function getStartupStorageKey(userId: string) {
  return `${startupStorageKeyPrefix}${userId}`;
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (!context) throw new Error('useAppMode AppModeProvider içinde kullanılmalı.');
  return context;
}
