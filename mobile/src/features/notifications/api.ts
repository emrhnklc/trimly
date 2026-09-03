import { apiDelete, apiGet, apiPatch, apiPut } from '@/lib/api/client';
import type { AppNotification } from './types';

export type PushDevicePlatform = 'IOS' | 'ANDROID';

export type NotificationPreferences = {
  appointmentRemindersEnabled: boolean;
  campaignsEnabled: boolean;
  recommendationsEnabled: boolean;
};

export function getAppNotifications(accessToken: string) {
  return apiGet<AppNotification[]>('/notifications', undefined, accessToken);
}

export function getNotificationPreferences(accessToken: string) {
  return apiGet<NotificationPreferences>('/notifications/preferences', undefined, accessToken);
}

export function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>,
  accessToken: string,
) {
  return apiPatch<NotificationPreferences>('/notifications/preferences', preferences, accessToken);
}

export function markAppNotificationAsRead(
  notificationId: string,
  accessToken: string,
) {
  return apiPatch<{ success: true }>(
    `/notifications/${notificationId}/read`,
    undefined,
    accessToken,
  );
}

export function markAllAppNotificationsAsRead(accessToken: string) {
  return apiPatch<{ success: true }>('/notifications/read-all', undefined, accessToken);
}

export function registerPushDevice(
  expoPushToken: string,
  platform: PushDevicePlatform,
  accessToken: string,
) {
  return apiPut<{ id: string; platform: PushDevicePlatform; updatedAt: string }>(
    '/notifications/push-devices',
    { expoPushToken, platform },
    accessToken,
  );
}

export function unregisterPushDevice(expoPushToken: string, accessToken: string) {
  return apiDelete<{ success: true }>(
    '/notifications/push-devices',
    accessToken,
    { expoPushToken },
  );
}
