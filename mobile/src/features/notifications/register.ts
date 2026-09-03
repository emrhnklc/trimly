import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PushDevicePlatform } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type RegisteredPushToken = {
  expoPushToken: string;
  platform: PushDevicePlatform;
};

export async function getRegisteredPushToken(): Promise<RegisteredPushToken | null> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('appointments', {
      importance: Notifications.AndroidImportance.HIGH,
      name: 'Randevular',
      sound: 'default',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return null;

  const currentPermission = await Notifications.getPermissionsAsync();
  const permission = currentPermission.granted
    ? currentPermission
    : await Notifications.requestPermissionsAsync();

  if (!permission.granted) return null;

  const expoPushToken = (
    await Notifications.getExpoPushTokenAsync({ projectId })
  ).data;

  return {
    expoPushToken,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  };
}
