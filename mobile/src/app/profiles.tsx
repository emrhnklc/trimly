import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAppMode, type StartupProfile } from '@/features/app-mode/AppModeProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import type { BusinessMembership } from '@/features/auth/types';
import { useBusiness } from '@/features/business/BusinessProvider';
import { businessRoleEnglishLabels, businessRoleLabels } from '@/features/business/role-labels';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { layout, radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export default function ProfilesScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const themeColors = useThemeColors();
  const { translate } = useAppPreferences();
  const { enterBusinessMode, enterCustomerMode, mode, setStartupProfile, startupProfile } = useAppMode();
  const { signOut, user } = useAuth();
  const { activeMembership, memberships } = useBusiness();
  const [switchingKey, setSwitchingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingStartupProfile, setSavingStartupProfile] = useState(false);
  const [startupPickerVisible, setStartupPickerVisible] = useState(false);

  if (!user) return null;
  const customerName = `${user.firstName} ${user.lastName}`;

  function goBack() {
    const fallback = returnTo === 'business-profile' || mode === 'business'
      ? '/(business)/profile'
      : '/(tabs)/profile';
    goBackOrReplace(router, fallback);
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

  async function chooseStartupProfile(profile: StartupProfile) {
    if (savingStartupProfile) return;
    setSavingStartupProfile(true);
    setError(null);
    try {
      await setStartupProfile(profile);
      setStartupPickerVisible(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Açılış profili kaydedilemedi.');
    } finally {
      setSavingStartupProfile(false);
    }
  }

  function confirmSignOut() {
    Alert.alert(
      translate('Çıkış yapılsın mı?', 'Sign out?'),
      translate('Trimly hesabından çıkış yapacaksın.', 'You will sign out of your Trimly account.'),
      [
        { style: 'cancel', text: translate('Vazgeç', 'Cancel') },
        { onPress: () => void signOut(), style: 'destructive', text: translate('Çıkış Yap', 'Sign Out') },
      ],
    );
  }

  const customerIsActive = mode === 'customer';
  const startupBusiness = startupProfile.startsWith('business:')
    ? memberships.find((membership) => `business:${membership.id}` === startupProfile)
    : null;
  const startupProfileLabel = startupProfile === 'customer'
    ? `${translate('Müşteri', 'Customer')} · ${customerName}`
    : startupBusiness?.barbershop.name
      ?? translate('Son kullandığım profil', 'Last used profile');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader
          onBackPress={goBack}
          title={translate('Profillerim', 'My Profiles')}
        />

        <Pressable
          accessibilityRole="button"
          disabled={savingStartupProfile}
          onPress={() => setStartupPickerVisible(true)}
          style={({ pressed }) => [
            styles.startupCard,
            { backgroundColor: themeColors.surface, borderColor: themeColors.border },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.startupIcon, { backgroundColor: themeColors.surfaceMuted }]}>
            <SymbolView
              name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }}
              size={22}
              tintColor={themeColors.primary}
            />
          </View>
          <View style={styles.startupCopy}>
            <AppText color="textMuted" variant="bodySmall">
              {translate('Uygulama açıldığında', 'When the app opens')}
            </AppText>
            <AppText color="primary" numberOfLines={1} style={styles.startupValue} variant="label">
              {savingStartupProfile ? translate('Kaydediliyor…', 'Saving…') : startupProfileLabel}
            </AppText>
          </View>
          <SymbolView
            name={{ ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }}
            size={20}
            tintColor={themeColors.textMuted}
          />
        </Pressable>

        <View style={styles.profileGrid}>
          <ProfileCard
            colors={themeColors}
            imageUrl={user.profileImageUrl}
            initial={user.firstName.slice(0, 1)}
            isActive={customerIsActive}
            isBusy={switchingKey === 'customer'}
            label={translate('Müşteri', 'Customer')}
            name={customerName}
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

        <Pressable
          accessibilityRole="button"
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.signOutButton, { borderColor: themeColors.danger }, pressed && styles.pressed]}>
          <SymbolView name={{ ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' }} size={19} tintColor={themeColors.danger} />
          <AppText color="danger" variant="label">{translate('Çıkış Yap', 'Sign Out')}</AppText>
        </Pressable>
      </ScrollView>

      <StartupProfileSheet
        customerName={customerName}
        memberships={memberships}
        onClose={() => setStartupPickerVisible(false)}
        onSelect={(profile) => void chooseStartupProfile(profile)}
        saving={savingStartupProfile}
        selectedProfile={startupProfile}
        visible={startupPickerVisible}
      />
    </Screen>
  );
}

function StartupProfileSheet({
  customerName,
  memberships,
  onClose,
  onSelect,
  saving,
  selectedProfile,
  visible,
}: {
  customerName: string;
  memberships: BusinessMembership[];
  onClose: () => void;
  onSelect: (profile: StartupProfile) => void;
  saving: boolean;
  selectedProfile: StartupProfile;
  visible: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { translate } = useAppPreferences();
  const options: { key: StartupProfile; label: string; description: string }[] = [
    {
      key: 'last_used',
      label: translate('Son kullandığım profil', 'Last used profile'),
      description: translate('Kaldığın profille devam et', 'Continue with your last profile'),
    },
    {
      key: 'customer',
      label: customerName,
      description: translate('Müşteri profili', 'Customer profile'),
    },
    ...memberships.map((membership) => ({
      key: `business:${membership.id}` as const,
      label: membership.barbershop.name,
      description: translate(
        businessRoleLabels[membership.role],
        businessRoleEnglishLabels[membership.role],
      ),
    })),
  ];

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.sheetBackdrop}>
        <Pressable
          accessibilityLabel={translate('Vazgeç', 'Cancel')}
          accessibilityRole="button"
          disabled={saving}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.startupSheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <AppText style={styles.sheetTitle} variant="sectionTitle">
            {translate('Açılış profili', 'Startup profile')}
          </AppText>
          <AppText color="textMuted" style={styles.sheetDescription} variant="bodySmall">
            {translate(
              'Trimly açıldığında görmek istediğin profili seç.',
              'Choose the profile you want to see when Trimly opens.',
            )}
          </AppText>

          <ScrollView
            contentContainerStyle={styles.startupOptions}
            showsVerticalScrollIndicator={false}>
            {options.map((option) => {
              const selected = option.key === selectedProfile;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  disabled={saving}
                  key={option.key}
                  onPress={() => onSelect(option.key)}
                  style={({ pressed }) => [
                    styles.startupOption,
                    {
                      backgroundColor: selected ? colors.surfaceMuted : colors.surface,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <View style={styles.startupOptionCopy}>
                    <AppText numberOfLines={1} variant="label">{option.label}</AppText>
                    <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
                      {option.description}
                    </AppText>
                  </View>
                  <View
                    style={[
                      styles.radio,
                      { borderColor: selected ? colors.primary : colors.border },
                      selected && { backgroundColor: colors.primary },
                    ]}>
                    {selected ? (
                      <SymbolView
                        name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                        size={13}
                        tintColor={colors.onPrimary}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          <AppButton disabled={saving} onPress={onClose} variant="secondary">
            {saving ? translate('Kaydediliyor…', 'Saving…') : translate('Vazgeç', 'Cancel')}
          </AppButton>
        </View>
      </View>
    </Modal>
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
          elevation: 5,
          shadowColor: colors.primary,
          shadowOffset: { height: 0, width: 0 },
          shadowOpacity: 0.22,
          shadowRadius: 10,
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
          {isBusy ? 'Geçiliyor…' : label}
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
  startupCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    minHeight: 74,
    padding: spacing.sm,
  },
  startupCopy: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
  startupValue: { fontSize: 15, lineHeight: 20, marginTop: 2 },
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
    minHeight: 228,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    width: '48%',
  },
  avatarFrame: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 108,
    padding: 3,
    width: 108,
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
  startupIcon: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  signOutButton: { alignItems: 'center', borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', marginTop: layout.sectionGap, minHeight: 52 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  sheetBackdrop: {
    backgroundColor: 'rgba(18, 14, 11, 0.52)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  startupSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.lg,
    width: 44,
  },
  sheetTitle: { textAlign: 'center' },
  sheetDescription: { marginTop: spacing.xxs, textAlign: 'center' },
  startupOptions: { gap: spacing.xs, paddingVertical: spacing.lg },
  startupOption: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    padding: spacing.sm,
  },
  startupOptionCopy: { flex: 1, gap: 2, minWidth: 0 },
  radio: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 25,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 25,
  },
  pressed: { opacity: 0.7 },
});
