import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import type { BusinessMembership } from '@/features/auth/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { businessRoleEnglishLabels, businessRoleLabels } from '@/features/business/role-labels';
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { layout, radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export default function ProfilesScreen() {
  const router = useRouter();
  const themeColors = useThemeColors();
  const { translate } = useAppPreferences();
  const { enterBusinessMode, enterCustomerMode, mode } = useAppMode();
  const { user } = useAuth();
  const { activeMembership, memberships } = useBusiness();
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(mode === 'business' ? '/(business)/profile' : '/(tabs)/profile');
  }

  async function selectCustomerProfile() {
    if (switchingKey) return;
    setSwitchingKey('customer');
    setError(null);
    try {
      await enterCustomerMode();
      router.replace('/(tabs)');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Müşteri profiline geçilemedi.');
      setSwitchingKey(null);
    }
  }

  async function selectBusinessProfile(membership: BusinessMembership) {
    if (switchingKey) return;
    setSwitchingKey(membership.id);
    setError(null);
    try {
      await enterBusinessMode(membership.id);
      router.replace('/(business)');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'İşletme profiline geçilemedi.');
      setSwitchingKey(null);
    }
  }

  const customerIsActive = mode === 'customer';

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Geri dön"
            icon={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
            onPress={goBack}
          />
          <AppText style={styles.title} variant="displayMedium">
            {translate('Profillerim', 'My Profiles')}
          </AppText>
          <View style={styles.topBarSpacer} />
        </View>

        <AppText color="textMuted" style={styles.description}>
          {translate(
            'Trimly’yi hangi profilinle kullanmak istediğini seç.',
            'Choose which profile you want to use with Trimly.',
          )}
        </AppText>

        <View style={styles.profileGrid}>
          <ProfileCard
            colors={themeColors}
            imageUrl={user.profileImageUrl}
            initial={user.firstName.slice(0, 1)}
            isActive={customerIsActive}
            isBusy={switchingKey === 'customer'}
            label={translate('Müşteri', 'Customer')}
            name={`${user.firstName} ${user.lastName}`}
            onPress={() => void selectCustomerProfile()}
          />

          {memberships.map((membership) => (
            <ProfileCard
              colors={themeColors}
              imageUrl={membership.barbershop.profileImageUrl}
              initial={membership.barbershop.name.slice(0, 1)}
              isActive={
                mode === 'business' && activeMembership?.id === membership.id
              }
              isBusy={switchingKey === membership.id}
              key={membership.id}
              label={translate(
                businessRoleLabels[membership.role],
                businessRoleEnglishLabels[membership.role],
              )}
              name={membership.barbershop.name}
              onPress={() => void selectBusinessProfile(membership)}
            />
          ))}
        </View>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: themeColors.dangerSurface }]}>
            <AppText color="danger" style={styles.errorText} variant="bodySmall">{error}</AppText>
          </View>
        ) : null}

        <AppText style={styles.sectionTitle} variant="sectionTitle">
          {translate('Yeni Profil', 'New Profile')}
        </AppText>
        <View
          style={[
            styles.actionsCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          ]}>
          <ProfileAction
            colors={themeColors}
            icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            label={translate('Yeni İşletme Oluştur', 'Create a New Business')}
            onPress={() => router.push({ pathname: '/onboarding/business', params: { source: 'profiles' } })}
          />
          <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
          <ProfileAction
            colors={themeColors}
            icon={{ ios: 'person.badge.plus', android: 'group_add', web: 'group_add' }}
            label={translate('Çalışan Davetine Katıl', 'Join with Employee Invite')}
            onPress={() => router.push({ pathname: '/onboarding/invitation', params: { source: 'profiles' } })}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function ProfileCard({
  colors,
  imageUrl,
  initial,
  isActive,
  isBusy,
  label,
  name,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  imageUrl: string | null;
  initial: string;
  isActive: boolean;
  isBusy: boolean;
  label: string;
  name: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityLabel={`${name}, ${label}${isActive ? ', aktif profil' : ''}`}
      accessibilityRole="button"
      disabled={isBusy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.profileCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        isActive && {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.primary,
          borderWidth: 2,
        },
        pressed && styles.pressed,
      ]}>
      <View
        style={[
          styles.avatarFrame,
          { borderColor: isActive ? colors.primary : colors.border },
        ]}>
        {imageUrl ? (
          <Image contentFit="cover" source={imageUrl} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <AppText color="primary" style={styles.initial} variant="displayLarge">
              {initial.toLocaleUpperCase('tr-TR')}
            </AppText>
          </View>
        )}
        {isActive ? (
          <View style={[styles.activeCheck, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={14}
              tintColor={colors.onPrimary}
            />
          </View>
        ) : null}
      </View>
      <AppText numberOfLines={2} style={styles.profileName} variant="label">{name}</AppText>
      <View
        style={[
          styles.profileBadge,
          { backgroundColor: isActive ? colors.background : colors.surfaceMuted },
        ]}>
        <AppText color="primary" numberOfLines={1} style={styles.profileLabel} variant="label">
          {isBusy ? 'Geçiliyor…' : isActive ? `${label} · Aktif` : label}
        </AppText>
      </View>
    </Pressable>
  );
}

function ProfileAction({
  colors,
  icon,
  label,
  onPress,
}: {
  colors: ReturnType<typeof useThemeColors>;
  icon: React.ComponentProps<typeof SymbolView>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
      <View style={[styles.actionIcon, { backgroundColor: colors.background }]}>
        <SymbolView name={icon} size={21} tintColor={colors.primary} />
      </View>
      <AppText style={styles.actionLabel} variant="label">{label}</AppText>
      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={17}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 25, lineHeight: 32 },
  topBarSpacer: { width: 44 },
  description: { marginTop: spacing.xs, textAlign: 'center' },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    minHeight: 204,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    width: '48%',
  },
  avatarFrame: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 94,
    padding: 3,
    width: 94,
  },
  avatar: { borderRadius: radius.pill, height: '100%', width: '100%' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: fontFamily.display, fontSize: 36, lineHeight: 42 },
  activeCheck: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    bottom: -2,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: -2,
    width: 28,
  },
  profileName: { marginTop: spacing.sm, minHeight: 36, textAlign: 'center' },
  profileBadge: {
    borderRadius: radius.pill,
    marginTop: spacing.xxs,
    maxWidth: '100%',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  profileLabel: { fontSize: 10, lineHeight: 14 },
  errorBox: { borderRadius: radius.md, marginTop: spacing.md, padding: spacing.sm },
  errorText: { textAlign: 'center' },
  sectionTitle: { marginBottom: spacing.sm, marginTop: layout.sectionGap },
  actionsCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  actionRow: { alignItems: 'center', flexDirection: 'row', minHeight: 64, padding: spacing.sm },
  actionIcon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  actionLabel: { flex: 1, marginLeft: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  pressed: { opacity: 0.7 },
});
