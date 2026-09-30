import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getNotificationPreferences,
  type NotificationPreferences,
  updateNotificationPreferences,
} from '@/features/notifications/api';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function CustomerNotificationPreferencesScreen() {
  const { token } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    appointmentRemindersEnabled: true,
    campaignsEnabled: false,
    recommendationsEnabled: true,
  });

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let active = true;
      void getNotificationPreferences(token).then((value) => {
        if (active) setPreferences(value);
      }).catch(() => undefined);
      return () => { active = false; };
    }, [token]),
  );

  async function changePreference(key: keyof NotificationPreferences, value: boolean) {
    if (!token) return;
    const previous = preferences;
    setPreferences({ ...preferences, [key]: value });
    try {
      setPreferences(await updateNotificationPreferences({ [key]: value }, token));
    } catch (reason) {
      setPreferences(previous);
      Alert.alert('Tercih kaydedilemedi', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Bildirim Tercihleri" />

        <PreferenceSection title="Randevular">
          <PreferenceRow icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }} label="Randevu Hatırlatmaları" onValueChange={(value) => void changePreference('appointmentRemindersEnabled', value)} value={preferences.appointmentRemindersEnabled} />
          <ComingSoonRow icon={{ ios: 'arrow.triangle.2.circlepath', android: 'event_repeat', web: 'event_repeat' }} isLast label="Randevu Değişiklikleri" />
        </PreferenceSection>

        <PreferenceSection title="Keşif">
          <PreferenceRow icon={{ ios: 'tag', android: 'local_offer', web: 'local_offer' }} label="Kampanyalar" onValueChange={(value) => void changePreference('campaignsEnabled', value)} value={preferences.campaignsEnabled} />
          <PreferenceRow icon={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} label="Kişisel Öneriler" onValueChange={(value) => void changePreference('recommendationsEnabled', value)} value={preferences.recommendationsEnabled} />
          <ComingSoonRow icon={{ ios: 'heart', android: 'favorite_border', web: 'favorite_border' }} isLast label="Favori Berber Bildirimleri" />
        </PreferenceSection>

        <PreferenceSection title="Uygulama">
          <ComingSoonRow icon={{ ios: 'megaphone', android: 'campaign', web: 'campaign' }} isLast label="Uygulama Duyuruları" />
        </PreferenceSection>
      </ScrollView>
    </Screen>
  );
}

function PreferenceSection({ children, title }: { children: React.ReactNode; title: string }) {
  return <View style={styles.section}><AppText style={styles.sectionTitle} variant="sectionTitle">{title}</AppText><AppCard style={styles.card}>{children}</AppCard></View>;
}

function PreferenceRow({ icon, isLast = false, label, onValueChange, value }: { icon: SymbolViewProps['name']; isLast?: boolean; label: string; onValueChange: (value: boolean) => void; value: boolean }) {
  const themeColors = useThemeColors();
  return <View style={[styles.row, !isLast && { borderBottomColor: themeColors.border, borderBottomWidth: 1 }]}><Icon icon={icon} /><AppText style={styles.label}>{label}</AppText><View style={styles.trailing}><Switch ios_backgroundColor={themeColors.border} onValueChange={onValueChange} style={styles.switch} thumbColor={themeColors.onPrimary} trackColor={{ false: themeColors.border, true: themeColors.primary }} value={value} /></View></View>;
}

function ComingSoonRow({ icon, isLast = false, label }: { icon: SymbolViewProps['name']; isLast?: boolean; label: string }) {
  const themeColors = useThemeColors();
  return <Pressable accessibilityLabel={`${label}, yakında`} disabled style={[styles.row, !isLast && { borderBottomColor: themeColors.border, borderBottomWidth: 1 }]}><Icon icon={icon} /><AppText style={styles.label}>{label}</AppText><View style={styles.trailing}><View style={[styles.soonBadge, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}><AppText color="textMuted" style={styles.soonLabel} variant="label">Yakında</AppText></View></View></Pressable>;
}

function Icon({ icon }: { icon: SymbolViewProps['name'] }) {
  const themeColors = useThemeColors();
  return <View style={[styles.icon, { backgroundColor: themeColors.background }]}><SymbolView name={icon} size={18} tintColor={themeColors.primary} /></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: layout.screenHorizontalPadding },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.xs },
  icon: { alignItems: 'center', borderRadius: radius.pill, height: 32, justifyContent: 'center', width: 32 },
  label: { flex: 1, fontSize: 14, lineHeight: 19, marginLeft: spacing.sm },
  trailing: { alignItems: 'flex-end', justifyContent: 'center', minHeight: 44, width: 76 },
  switch: { transform: [{ scale: 0.82 }] },
  soonBadge: { borderRadius: radius.pill, borderWidth: 1, paddingHorizontal: spacing.xs, paddingVertical: 3 },
  soonLabel: { fontSize: 9, lineHeight: 12 },
});
