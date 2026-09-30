import { Tabs, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  getBusinessAppointments,
  getMyBusinessAppointments,
} from '@/features/appointments/api';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getBarbershopReadiness,
  getBookingSettings,
  getPublicBarbershop,
} from '@/features/barbershops/api';
import { getDateKey } from '@/features/business-appointments/date';
import {
  getDailyBusinessSummary,
  getManagementServices,
} from '@/features/business-management/api';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessRolePendingScreen } from '@/features/business/components/BusinessRolePendingScreen';
import { BusinessTabBar } from '@/features/business/components/BusinessTabBar';
import { getBusinessCustomers } from '@/features/business-customers/api';
import { getBusinessMembers } from '@/features/members/api';
import {
  getBusinessWorkingHours,
  getMyMemberWorkingHours,
} from '@/features/schedules/api';

export default function BusinessModeLayout() {
  const { token } = useAuth();
  const { activeMembership, can, publishedBusinessIds } = useBusiness();
  const [discoverabilityByBusinessId, setDiscoverabilityByBusinessId] =
    useState<Record<string, boolean>>({});

  useFocusEffect(
    useCallback(() => {
      if (!activeMembership) return;
      let isActive = true;
      const businessId = activeMembership.barbershop.id;

      // Keep the tab navigator mounted while refreshing. Clearing this value on
      // every focus resets the complete tab/stack state to its initial route.
      void getPublicBarbershop(activeMembership.barbershop.slug)
        .then((business) => {
          if (isActive) {
            setDiscoverabilityByBusinessId((current) => ({
              ...current,
              [businessId]: business.isDiscoverable,
            }));
          }
        })
        .catch(() => {
          if (isActive) {
            setDiscoverabilityByBusinessId((current) => ({
              ...current,
              [businessId]: false,
            }));
          }
        });
      return () => {
        isActive = false;
      };
    }, [activeMembership]),
  );

  useEffect(() => {
    if (!activeMembership || !token) return;

    const barbershopId = activeMembership.barbershop.id;
    const requests: Promise<unknown>[] = [
      getPublicBarbershop(activeMembership.barbershop.slug),
      can('VIEW_ALL_APPOINTMENTS')
        ? getBusinessAppointments(barbershopId, token)
        : getMyBusinessAppointments(barbershopId, token),
      can('VIEW_ALL_APPOINTMENTS')
        ? getBusinessWorkingHours(barbershopId)
        : getMyMemberWorkingHours(barbershopId, token),
    ];

    if (can('VIEW_ALL_APPOINTMENTS')) {
      requests.push(getBusinessMembers(barbershopId, token));
    }
    if (can('VIEW_CUSTOMERS')) {
      requests.push(getBusinessCustomers(barbershopId, token));
    }
    if (can('MANAGE_SERVICES')) {
      const today = getDateKey(
        new Date(),
        activeMembership.barbershop.timezone,
      );
      requests.push(
        getManagementServices(barbershopId, token),
        getBookingSettings(barbershopId),
        getDailyBusinessSummary(barbershopId, today, token),
        getBarbershopReadiness(barbershopId, token),
      );
    }

    void Promise.allSettled(requests);
  }, [activeMembership, can, token]);

  if (!activeMembership) return null;
  if (!can('ACCESS_BUSINESS_MODE')) return <BusinessRolePendingScreen />;
  const isDiscoverable =
    discoverabilityByBusinessId[activeMembership.barbershop.id] ??
    activeMembership.barbershop.isDiscoverable;
  const isSetupMode =
    !isDiscoverable &&
    !publishedBusinessIds.has(activeMembership.barbershop.id);

  return (
    <Tabs
      initialRouteName={
        isSetupMode
          ? 'management'
          : can('VIEW_OWN_APPOINTMENTS')
            ? 'index'
            : 'calendar'
      }
      key={isSetupMode ? 'business-setup' : 'business-live'}
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BusinessTabBar {...props} setupMode={isSetupMode} />}
    >
      <Tabs.Screen
        name="index"
        options={{ href: can('VIEW_OWN_APPOINTMENTS') ? undefined : null }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ href: can('VIEW_OWN_SCHEDULE') ? undefined : null }}
      />
      <Tabs.Screen
        name="services"
        options={{ href: can('VIEW_SERVICE_CATALOG') ? undefined : null }}
      />
      <Tabs.Screen
        name="customers"
        options={{ href: can('VIEW_CUSTOMERS') ? undefined : null }}
      />
      <Tabs.Screen
        name="management"
        options={{ href: can('MANAGE_SERVICES') ? undefined : null }}
      />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
