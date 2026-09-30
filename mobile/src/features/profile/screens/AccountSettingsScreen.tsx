import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function AccountSettingsScreen() {
  const router = useRouter();

  function showComingSoon(feature: string) {
    Alert.alert(`${feature} yakında`, 'Bu özelliği sağlam bir altyapıyla hazırlayıp aktif edeceğiz.');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Hesap Ayarları" />

        <SettingsSection title="Hesabım">
          <SettingsRow
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            isLast
            label="Hesap Bilgileri"
            onPress={() =>
              router.push({
                pathname: '/(business)/profile/edit',
                params: { returnTo: 'business-settings' },
              })
            }
          />
        </SettingsSection>

        <SettingsSection title="Şifre & Güvenlik">
          <SettingsRow icon={{ ios: 'lock', android: 'lock', web: 'lock' }} label="Şifre Değiştir" onPress={() => router.push('/password/change')} />
          <SettingsRow icon={{ ios: 'link', android: 'link', web: 'link' }} label="Bağlı Hesaplar" onPress={() => showComingSoon('Bağlı hesaplar')} />
          <SettingsRow icon={{ ios: 'laptopcomputer', android: 'devices', web: 'devices' }} isLast label="Aktif Oturumlar" onPress={() => router.push('/sessions')} />
        </SettingsSection>

        <SettingsSection title="Veri & Gizlilik">
          <SettingsRow icon={{ ios: 'arrow.down.to.line', android: 'download', web: 'download' }} label="Verilerimi Dışa Aktar" onPress={() => router.push('/data-export')} />
          <SettingsRow danger icon={{ ios: 'trash', android: 'delete', web: 'delete' }} isLast label="Hesabı Sil" onPress={() => router.push('/account-delete')} />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">{title}</AppText>
      <AppCard style={styles.sectionCard}>{children}</AppCard>
    </View>
  );
}

type SettingsRowProps = {
  danger?: boolean;
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  onPress: () => void;
};

function SettingsRow({ danger = false, icon, isLast = false, label, onPress }: SettingsRowProps) {
  const themeColors = useThemeColors();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && [styles.divider, { borderBottomColor: themeColors.border }],
        pressed && styles.pressed,
      ]}>
      <View style={[
        styles.rowIcon,
        { backgroundColor: danger ? themeColors.dangerSurface : themeColors.surfaceMuted },
      ]}>
        <SymbolView name={icon} size={18} tintColor={danger ? themeColors.danger : themeColors.primary} />
      </View>
      <AppText color={danger ? 'danger' : 'text'} style={styles.rowLabel}>{label}</AppText>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={themeColors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: layout.screenHorizontalPadding },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: spacing.sm },
  sectionCard: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: spacing.xs },
  divider: { borderBottomWidth: 1 },
  rowIcon: { alignItems: 'center', borderRadius: radius.pill, height: 32, justifyContent: 'center', width: 32 },
  rowLabel: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.sm },
  pressed: { opacity: 0.62 },
});
