import { Image } from 'expo-image';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useBusiness } from '@/features/business/BusinessProvider';
import { businessRoleLabels } from '@/features/business/role-labels';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';

export function AccountSettingsScreen() {
  const router = useRouter();
  const { activeMembership, memberships } = useBusiness();

  function showComingSoon(feature: string) {
    Alert.alert(`${feature} yakında`, 'Bu özelliği sağlam bir altyapıyla hazırlayıp aktif edeceğiz.');
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Hesap Ayarları" />

        <SettingsSection title="Hesabım">
          <SettingsRow icon={{ ios: 'person', android: 'person', web: 'person' }} isLast label="Hesap Bilgileri" onPress={() => router.push('/(business)/profile/edit')} />
        </SettingsSection>

        <SettingsSection title="Şifre & Güvenlik">
          <SettingsRow icon={{ ios: 'lock', android: 'lock', web: 'lock' }} label="Şifre Değiştir" onPress={() => router.push('/password/change')} />
          <SettingsRow icon={{ ios: 'link', android: 'link', web: 'link' }} label="Bağlı Hesaplar" onPress={() => showComingSoon('Bağlı hesaplar')} />
          <SettingsRow icon={{ ios: 'laptopcomputer', android: 'devices', web: 'devices' }} isLast label="Aktif Oturumlar" onPress={() => router.push('/sessions')} />
        </SettingsSection>

        <SettingsSection title="İşletme Erişimlerim">
          {memberships.map((membership, index) => (
            <BusinessAccessRow
              active={membership.id === activeMembership?.id}
              isLast={index === memberships.length - 1}
              key={membership.id}
              name={membership.barbershop.name}
              profileImageUrl={membership.barbershop.profileImageUrl}
              role={businessRoleLabels[membership.role]}
              onPress={() => router.push('/profiles')}
            />
          ))}
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
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}>
        <SymbolView name={icon} size={18} tintColor={danger ? colors.danger : colors.primary} />
      </View>
      <AppText color={danger ? 'danger' : 'text'} style={styles.rowLabel}>{label}</AppText>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={colors.textMuted} />
    </Pressable>
  );
}

function BusinessAccessRow({ active, isLast, name, onPress, profileImageUrl, role }: {
  active: boolean;
  isLast: boolean;
  name: string;
  onPress: () => void;
  profileImageUrl: string | null;
  role: string;
}) {
  const initial = name.slice(0, 1).toLocaleUpperCase('tr-TR');
  const compactRole = role === 'İşletme Sahibi' ? 'Sahip' : role;
  return (
    <Pressable
      accessibilityLabel={`${name} işletmesine geç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>
      {profileImageUrl ? (
        <Image contentFit="cover" source={profileImageUrl} style={styles.businessAvatar} />
      ) : (
        <View style={[styles.businessAvatar, styles.businessAvatarPlaceholder]}>
          <AppText color="primary" style={styles.businessInitial} variant="heading">{initial}</AppText>
        </View>
      )}
      <View style={styles.businessCopy}>
        <AppText numberOfLines={1} style={styles.businessName}>{name}</AppText>
        <AppText color="textMuted" style={styles.businessStatus} variant="bodySmall">
          {active ? 'Aktif işletme' : 'Bağlı işletme'}
        </AppText>
      </View>
      <View style={[styles.roleBadge, active && styles.activeRoleBadge]}>
        <AppText color={active ? 'primary' : 'textMuted'} style={styles.roleText} variant="overline">
          {compactRole}
        </AppText>
      </View>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: layout.screenHorizontalPadding },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: spacing.sm },
  sectionCard: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 58, paddingHorizontal: spacing.xs },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowIcon: { alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.pill, height: 32, justifyContent: 'center', width: 32 },
  dangerIcon: { backgroundColor: '#F8E8E5' },
  rowLabel: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.sm },
  businessAvatar: { borderRadius: radius.pill, height: 32, width: 32 },
  businessAvatarPlaceholder: { alignItems: 'center', backgroundColor: colors.background, justifyContent: 'center' },
  businessInitial: { fontSize: 14, lineHeight: 18 },
  businessCopy: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  businessName: { fontSize: 13, lineHeight: 18 },
  businessStatus: { fontSize: 11, lineHeight: 14, marginTop: 1 },
  roleBadge: { backgroundColor: colors.background, borderRadius: radius.pill, marginLeft: spacing.xs, marginRight: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  activeRoleBadge: { backgroundColor: '#FBF3DE' },
  roleText: { fontSize: 8, lineHeight: 10 },
  pressed: { opacity: 0.62 },
});
