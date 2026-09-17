import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { registerPushDevice, unregisterPushDevice } from './api';
import { getRegisteredPushToken } from './register';

type AppointmentNotificationData = {
  type?: unknown;
  appointmentId?: unknown;
  barbershopId?: unknown;
};

export function PushNotificationsManager() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { enterBusinessMode, enterCustomerMode } = useAppMode();
  const { memberships } = useBusiness();
  const handledResponses = useRef(new Set<string>());
  const userId = user?.id ?? null;
  const membershipSignature = useMemo(
    () => memberships.map((membership) => membership.id).join(','),
    [memberships],
  );

  useEffect(() => {
    if (!token || !userId) return;

    const accessToken = token;
    let isActive = true;
    let registeredToken: string | null = null;

    async function registerCurrentDevice() {
      try {
        const pushToken = await getRegisteredPushToken();
        if (!pushToken) return;

        await registerPushDevice(
          pushToken.expoPushToken,
          pushToken.platform,
          accessToken,
        );

        if (!isActive) {
          await unregisterPushDevice(pushToken.expoPushToken, accessToken).catch(
            () => undefined,
          );
          return;
        }

        registeredToken = pushToken.expoPushToken;
      } catch (reason) {
        if (__DEV__) console.warn('Push bildirimi kaydedilemedi.', reason);
      }
    }

    void registerCurrentDevice();

    return () => {
      isActive = false;
      if (registeredToken) {
        void unregisterPushDevice(registeredToken, accessToken).catch(() => undefined);
      }
    };
  }, [membershipSignature, token, userId]);

  const openAppointment = useCallback(
    async (response: Notifications.NotificationResponse) => {
      if (handledResponses.current.has(response.notification.request.identifier)) return;

      const data = response.notification.request.content.data as AppointmentNotificationData;
      if (typeof data.appointmentId !== 'string') {
        return;
      }

      if (
        data.type === 'APPOINTMENT_REMINDER' ||
        data.type === 'PORTFOLIO_CONSENT_REQUEST'
      ) {
        handledResponses.current.add(response.notification.request.identifier);
        await enterCustomerMode();
        router.push({
          pathname: '/appointments/[appointmentId]',
          params: { appointmentId: data.appointmentId },
        });
        return;
      }

      if (data.type !== 'NEW_APPOINTMENT' || typeof data.barbershopId !== 'string') return;

      const membership = memberships.find(
        (item) => item.barbershop.id === data.barbershopId,
      );
      if (!membership) return;

      handledResponses.current.add(response.notification.request.identifier);
      await enterBusinessMode(membership.id);
      router.push({
        pathname: '/business-appointments/[appointmentId]',
        params: { appointmentId: data.appointmentId },
      });
    },
    [enterBusinessMode, enterCustomerMode, memberships, router],
  );

  useEffect(() => {
    if (!user) return;

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => void openAppointment(response),
    );
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) void openAppointment(response);
    });

    return () => subscription.remove();
  }, [openAppointment, user]);

  return null;
}
