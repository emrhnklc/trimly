import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import {
  getAppNotifications,
  markAllAppNotificationsAsRead,
  markAppNotificationAsRead,
} from './api';
import type { AppNotification } from './types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function formatNotificationDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function NotificationCenterScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { enterBusinessMode, enterCustomerMode } = useAppMode();
  const { memberships } = useBusiness();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (refreshing = false) => {
      if (!token) return;

      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        setNotifications(await getAppNotifications(token));
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Bildirimler yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useFocusEffect(
    useCallback(() => {
      void loadNotifications();
    }, [loadNotifications]),
  );

  async function openNotification(notification: AppNotification) {
    if (!token) return;

    if (!notification.readAt) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
        ),
      );
      await markAppNotificationAsRead(notification.id, token).catch(() => undefined);
    }

    if (
      notification.type === 'APPOINTMENT_REMINDER' ||
      notification.type === 'PORTFOLIO_CONSENT_REQUEST'
    ) {
      await enterCustomerMode();
      router.replace({
        pathname: '/appointments/[appointmentId]',
        params: { appointmentId: notification.appointment.id },
      });
      return;
    }

    const membership = memberships.find(
      (item) => item.barbershop.id === notification.barbershop.id,
    );
    if (!membership) return;

    await enterBusinessMode(membership.id);
    router.replace({
      pathname: '/business-appointments/[appointmentId]',
      params: { appointmentId: notification.appointment.id },
    });
  }

  async function markAllRead() {
    if (!token) return;

    const readAt = new Date().toISOString();
    setNotifications((current) => current.map((item) => ({ ...item, readAt })));
    await markAllAppNotificationsAsRead(token).catch(() => void loadNotifications());
  }

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  return (
    <Screen>
      <View style={styles.header}>
        <AppIconButton
          accessibilityLabel="Geri dön"
          icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
          onPress={() => router.back()}
          variant="transparent"
        />
        <AppText style={styles.title} variant="heading">Bildirimler</AppText>
        <Pressable
          accessibilityLabel="Tüm bildirimleri okundu işaretle"
          disabled={unreadCount === 0}
          onPress={() => void markAllRead()}
          style={({ pressed }) => [styles.readAll, pressed && unreadCount > 0 && styles.pressed]}>
          <AppText color={unreadCount ? 'primary' : 'textMuted'} variant="bodySmall">
            Tümünü oku
          </AppText>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void loadNotifications(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }>
        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? <AppText color="danger">{error}</AppText> : null}
        {!isLoading && !error && notifications.length === 0 ? (
          <View style={styles.empty}>
            <SymbolView
              name={{ ios: 'bell.slash', android: 'notifications_off', web: 'notifications_off' }}
              size={28}
              tintColor={colors.textMuted}
            />
            <AppText style={styles.emptyTitle} variant="heading">Henüz bildirim yok</AppText>
            <AppText color="textMuted" style={styles.emptyCopy} variant="bodySmall">
              Yeni randevular burada görünecek.
            </AppText>
          </View>
        ) : null}
        {notifications.map((notification) => (
          <Pressable
            accessibilityLabel={`${notification.title}: ${notification.body}`}
            accessibilityRole="button"
            key={notification.id}
            onPress={() => void openNotification(notification)}
            style={({ pressed }) => [
              styles.item,
              !notification.readAt && styles.itemUnread,
              pressed && styles.pressed,
            ]}>
            <View style={styles.iconShell}>
              <SymbolView
                name={{ ios: 'calendar.badge.plus', android: 'event_available', web: 'event_available' }}
                size={19}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.copy}>
              <AppText style={styles.notificationTitle} variant="label">{notification.title}</AppText>
              <AppText color="textMuted" style={styles.body} variant="bodySmall">
                {notification.body}
              </AppText>
              <AppText color="textMuted" style={styles.date} variant="bodySmall">
                {notification.barbershop.name} · {formatNotificationDate(notification.createdAt)}
              </AppText>
            </View>
            {!notification.readAt ? <View style={styles.unreadDot} /> : null}
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.sm,
  },
  title: { flex: 1, textAlign: 'center' },
  readAll: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 78, paddingVertical: spacing.sm },
  content: { padding: spacing.lg, paddingBottom: 48 },
  loader: { marginTop: spacing.xxxl },
  empty: { alignItems: 'center', marginTop: spacing.xxxl, paddingHorizontal: spacing.xl },
  emptyTitle: { marginTop: spacing.md },
  emptyCopy: { marginTop: spacing.xs, textAlign: 'center' },
  item: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  itemUnread: { borderColor: '#D5A538', backgroundColor: '#FFF9EE' },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  copy: { flex: 1, marginLeft: spacing.sm },
  notificationTitle: { fontSize: 14, lineHeight: 19 },
  body: { lineHeight: 18, marginTop: 2 },
  date: { fontSize: 11, lineHeight: 15, marginTop: 4 },
  unreadDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 8, marginLeft: spacing.xs, width: 8 },
  pressed: { opacity: 0.68 },
});
