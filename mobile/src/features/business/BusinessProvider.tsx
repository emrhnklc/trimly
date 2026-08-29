import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import type { BusinessMembership } from '@/features/auth/types';

type BusinessContextValue = {
  activeMembership: BusinessMembership | null;
  isReady: boolean;
  memberships: BusinessMembership[];
  selectMembership: (membershipId: string) => Promise<void>;
};

const BusinessContext = createContext<BusinessContextValue | null>(null);
const storageKeyPrefix = 'trimly.business.active.';

export function BusinessProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const memberships = useMemo(
    () => user?.businessMemberships.filter((membership) => membership.isActive) ?? [],
    [user?.businessMemberships],
  );
  const membershipSignature = memberships.map((membership) => membership.id).join(',');
  const userId = user?.id ?? null;
  const [activeMembershipId, setActiveMembershipId] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function restoreActiveMembership() {
      if (!user) {
        setActiveMembershipId(null);
        setResolvedUserId(null);
        return;
      }

      const storageKey = getStorageKey(user.id);

      try {
        const savedMembershipId = await SecureStore.getItemAsync(storageKey);
        const savedMembershipIsValid = memberships.some(
          (membership) => membership.id === savedMembershipId,
        );
        const nextMembershipId = savedMembershipIsValid
          ? savedMembershipId
          : memberships.length === 1
            ? memberships[0].id
            : null;

        if (!isMounted) return;
        setActiveMembershipId(nextMembershipId);

        if (nextMembershipId && nextMembershipId !== savedMembershipId) {
          await SecureStore.setItemAsync(storageKey, nextMembershipId);
        } else if (!nextMembershipId && savedMembershipId) {
          await SecureStore.deleteItemAsync(storageKey);
        }
      } catch {
        if (isMounted) {
          setActiveMembershipId(memberships.length === 1 ? memberships[0].id : null);
        }
      } finally {
        if (isMounted) setResolvedUserId(user.id);
      }
    }

    void restoreActiveMembership();

    return () => {
      isMounted = false;
    };
  }, [membershipSignature, memberships, user, userId]);

  const activeMembership =
    memberships.find((membership) => membership.id === activeMembershipId) ?? null;
  const isReady = resolvedUserId === userId;

  async function selectMembership(membershipId: string) {
    if (!user) throw new Error('İşletme seçmek için giriş yapmalısın.');

    const membership = memberships.find((item) => item.id === membershipId);
    if (!membership) throw new Error('Bu işletmede aktif bir üyeliğin bulunmuyor.');

    await SecureStore.setItemAsync(getStorageKey(user.id), membership.id);
    setActiveMembershipId(membership.id);
  }

  return (
    <BusinessContext.Provider
      value={{ activeMembership, isReady, memberships, selectMembership }}>
      {children}
    </BusinessContext.Provider>
  );
}

function getStorageKey(userId: string) {
  return `${storageKeyPrefix}${userId}`;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness BusinessProvider içinde kullanılmalı.');
  return context;
}
