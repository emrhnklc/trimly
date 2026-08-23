import type { ReactNode } from 'react';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function ProfileScreen() {
  const { signOut, user } = useAuth();
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [campaignsEnabled, setCampaignsEnabled] = useState(false);
  const [recommendationsEnabled, setRecommendationsEnabled] = useState(true);

  if (!user) return null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText color="primary" variant="overline">TRIMLY</AppText>
          <AppText style={styles.title} variant="displayMedium">Hesap Ayarları</AppText>
        </View>

        <SettingsGroup title="Hesap Bilgilerim">
          <SettingsRow label="Ad Soyad" value={`${user.firstName} ${user.lastName}`} />
          <SettingsRow label="E-posta" value={user.email} />
          <SettingsRow label="Telefon" value={user.phone || 'Eklenmedi'} />
          <SettingsRow label="Doğum Tarihi" value="Eklenmedi" />
          <SettingsRow label="Cinsiyet" value="Eklenmedi" isLast />
        </SettingsGroup>

        <SettingsGroup title="Ödeme & Geçmiş">
          <SettingsRow label="Ödeme Yöntemlerim" />
          <SettingsRow label="İşlem Geçmişim" />
          <SettingsRow label="Faturalar" isLast />
        </SettingsGroup>

        <SettingsGroup title="Tercihler">
          <PreferenceRow
            label="Randevu Hatırlatmaları"
            onValueChange={setRemindersEnabled}
            value={remindersEnabled}
          />
          <PreferenceRow
            label="Kampanya & Duyurular"
            onValueChange={setCampaignsEnabled}
            value={campaignsEnabled}
          />
          <PreferenceRow
            isLast
            label="Kişiselleştirilmiş Öneriler"
            onValueChange={setRecommendationsEnabled}
            value={recommendationsEnabled}
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

function SettingsRow({ isLast = false, label, value }: { isLast?: boolean; label: string; value?: string }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <AppText>{label}</AppText>
      <View style={styles.rowValue}>
        {value ? <AppText color="textMuted" numberOfLines={1} style={styles.valueText}>{value}</AppText> : null}
        <AppText color="textMuted" variant="heading">›</AppText>
      </View>
    </View>
  );
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
  header: { alignItems: 'center', paddingTop: spacing.sm },
  title: { marginTop: spacing.xs },
  group: { marginTop: spacing.lg, padding: spacing.md },
  rows: { marginTop: spacing.sm },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowValue: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, maxWidth: '60%' },
  valueText: { flexShrink: 1, textAlign: 'right' },
  signOut: { marginTop: spacing.lg },
});
