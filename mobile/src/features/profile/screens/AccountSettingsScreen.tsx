import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getNotificationPreferences,
  type NotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export function AccountSettingsScreen() {
  const router = useRouter();
  const { signOut, token, user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    appointmentRemindersEnabled: true,
    campaignsEnabled: false,
    recommendationsEnabled: true,
  });

  useFocusEffect(
    useCallback(() => {
      if (!token) return;

      let isActive = true;
      void getNotificationPreferences(token)
        .then((nextPreferences) => {
          if (isActive) setPreferences(nextPreferences);
        })
        .catch(() => undefined);

      return () => {
        isActive = false;
      };
    }, [token]),
  );

  if (!user) return null;

  async function changePreference(
    key: keyof NotificationPreferences,
    value: boolean,
  ) {
    if (!token) return;

    const previousPreferences = preferences;
    const nextPreferences = { ...preferences, [key]: value };
    setPreferences(nextPreferences);

    try {
      const savedPreferences = await updateNotificationPreferences({ [key]: value }, token);
      setPreferences(savedPreferences);
    } catch (reason) {
      setPreferences(previousPreferences);
      Alert.alert(
        'Tercih kaydedilemedi',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Profile geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={() => router.back()}
            variant="transparent"
          />
          <AppText style={styles.title} variant="displayMedium">Hesap Ayarları</AppText>
          <View style={styles.topBarSpacer} />
        </View>

        <SettingsGroup title="Hesap Bilgilerim">
          <SettingsRow
            label="Ad Soyad"
            onPress={() => router.push('/profile/edit')}
            value={`${user.firstName} ${user.lastName}`}
          />
          <SettingsRow label="E-posta" value={user.email} />
          <SettingsRow
            label="Telefon"
            onPress={() => router.push('/profile/edit')}
            value={user.phone || 'Eklenmedi'}
          />
          <SettingsRow label="Doğum Tarihi" value="Eklenmedi" />
          <SettingsRow label="Cinsiyet" value="Eklenmedi" isLast />
        </SettingsGroup>

        <SettingsGroup title="Kaydettiklerin">
          <SettingsRow isLast label="Favori Berberlerim" onPress={() => router.push('/favorites')} />
        </SettingsGroup>

        <SettingsGroup title="Ödeme & Geçmiş">
          <SettingsRow label="Ödeme Yöntemlerim" />
          <SettingsRow label="İşlem Geçmişim" />
          <SettingsRow label="Faturalar" isLast />
        </SettingsGroup>

        <SettingsGroup title="Tercihler">
          <PreferenceRow
            label="Randevu Hatırlatmaları"
            onValueChange={(value) => void changePreference('appointmentRemindersEnabled', value)}
            value={preferences.appointmentRemindersEnabled}
          />
          <PreferenceRow
            label="Kampanya & Duyurular"
            onValueChange={(value) => void changePreference('campaignsEnabled', value)}
            value={preferences.campaignsEnabled}
          />
          <PreferenceRow
            isLast
            label="Kişiselleştirilmiş Öneriler"
            onValueChange={(value) => void changePreference('recommendationsEnabled', value)}
            value={preferences.recommendationsEnabled}
          />
        </SettingsGroup>

        <View style={styles.signOut}>
          <AppButton onPress={() => void signOut()} variant="ghost">Çıkış Yap</AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

function SettingsGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <AppCard style={styles.group}>
      <AppText variant="heading">{title}</AppText>
      <View style={styles.rows}>{children}</View>
    </AppCard>
  );
}

function SettingsRow({
  isLast = false,
  label,
  onPress,
  value,
}: {
  isLast?: boolean;
  label: string;
  onPress?: () => void;
  value?: string;
}) {
  const content = (
    <>
      <AppText>{label}</AppText>
      <View style={styles.rowValue}>
        {value ? <AppText color="textMuted" numberOfLines={1} style={styles.valueText}>{value}</AppText> : null}
        <AppText color="textMuted" variant="heading">›</AppText>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityLabel={`${label} ekranını aç`}
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && styles.rowPressed]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, !isLast && styles.rowBorder]}>{content}</View>;
}

function PreferenceRow({
  isLast = false,
  label,
  onValueChange,
  value,
}: {
  isLast?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <AppText>{label}</AppText>
      <Switch
        ios_backgroundColor={colors.border}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  topBarSpacer: { width: 44 },
  title: { flex: 1, fontSize: 24, lineHeight: 30, textAlign: 'center' },
  group: { marginTop: spacing.lg, padding: spacing.md },
  rows: { marginTop: spacing.sm },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowPressed: { opacity: 0.62 },
  rowValue: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, maxWidth: '60%' },
  valueText: { flexShrink: 1, textAlign: 'right' },
  signOut: { marginTop: spacing.lg },
});
