import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { useAppMode } from '@/features/app-mode/AppModeProvider';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import {
  useAppPreferences,
  type AppLanguage,
  type ThemePreference,
} from '@/features/preferences/AppPreferencesProvider';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type PreferenceRow = {
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  onPress: () => void;
  value: string;
};

type ActivePreference = 'language' | 'location' | 'theme' | null;

export function ApplicationSettingsScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { mode } = useAppMode();
  const colors = useThemeColors();
  const [activePreference, setActivePreference] = useState<ActivePreference>(null);
  const {
    language,
    setLanguage,
    setThemePreference,
    themePreference,
    translate,
  } = useAppPreferences();

  const themeLabels: Record<ThemePreference, string> = {
    dark: translate('Koyu', 'Dark'),
    light: translate('Açık', 'Light'),
    system: translate('Sistem', 'System'),
  };
  const languageLabels: Record<AppLanguage, string> = { en: 'English', tr: 'Türkçe' };

  const options: PreferenceRow[] = [
    {
      icon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
      label: translate('Tema', 'Theme'),
      onPress: () => setActivePreference('theme'),
      value: themeLabels[themePreference],
    },
    {
      icon: { ios: 'globe', android: 'language', web: 'language' },
      label: translate('Dil', 'Language'),
      onPress: () => setActivePreference('language'),
      value: languageLabels[language],
    },
    {
      icon: { ios: 'location', android: 'location_on', web: 'location_on' },
      isLast: true,
      label: translate('Konum', 'Location'),
      onPress: () => setActivePreference('location'),
      value: translate('Otomatik', 'Automatic'),
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader
          onBackPress={() =>
            goBackOrReplace(
              router,
              returnTo === 'business-profile' || mode === 'business'
                ? '/(business)/profile'
                : '/(tabs)/profile',
            )
          }
          title={translate('Uygulama Ayarları', 'App Settings')}
        />

        <View style={styles.section}>
          <AppText style={styles.sectionTitle} variant="sectionTitle">
            {translate('Tercihler', 'Preferences')}
          </AppText>
          <AppCard style={styles.card}>
            {options.map((option) => (
              <Pressable
                accessibilityLabel={`${option.label}: ${option.value}`}
                accessibilityRole="button"
                key={option.label}
                onPress={option.onPress}
                style={({ pressed }) => [
                  styles.row,
                  !option.isLast && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.icon, { backgroundColor: colors.background }]}>
                  <SymbolView name={option.icon} size={18} tintColor={colors.primary} />
                </View>
                <AppText style={styles.label}>{option.label}</AppText>
                <AppText color="textMuted" style={styles.value} variant="bodySmall">
                  {option.value}
                </AppText>
                <SymbolView
                  name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                  size={14}
                  tintColor={colors.textMuted}
                />
              </Pressable>
            ))}
          </AppCard>
        </View>
      </ScrollView>

      <PreferenceSheet
        description={
          activePreference === 'theme'
            ? translate('Uygulamanın görünümünü seç.', 'Choose the app appearance.')
            : activePreference === 'language'
              ? translate('Uygulama dilini seç.', 'Choose the app language.')
              : translate(
                  'Yakındaki işletmeler için konum tercihi şu anda otomatik kullanılıyor.',
                  'Location is currently used automatically for nearby businesses.',
                )
        }
        onClose={() => setActivePreference(null)}
        onSelect={(value) => {
          if (activePreference === 'theme') void setThemePreference(value as ThemePreference);
          if (activePreference === 'language') void setLanguage(value as AppLanguage);
          setActivePreference(null);
        }}
        options={
          activePreference === 'theme'
            ? [
                { label: translate('Sistem', 'System'), value: 'system' },
                { label: translate('Açık', 'Light'), value: 'light' },
                { label: translate('Koyu', 'Dark'), value: 'dark' },
              ]
            : activePreference === 'language'
              ? [
                  { label: 'Türkçe', value: 'tr' },
                  { label: 'English', value: 'en' },
                ]
              : [{ label: translate('Otomatik', 'Automatic'), value: 'automatic' }]
        }
        selectedValue={
          activePreference === 'theme'
            ? themePreference
            : activePreference === 'language'
              ? language
              : 'automatic'
        }
        title={
          activePreference === 'theme'
            ? translate('Tema', 'Theme')
            : activePreference === 'language'
              ? translate('Dil', 'Language')
              : translate('Konum', 'Location')
        }
        visible={activePreference !== null}
      />
    </Screen>
  );
}

function PreferenceSheet({
  description,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  visible,
}: {
  description: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: { label: string; value: string }[];
  selectedValue: string;
  title: string;
  visible: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalRoot}>
        <Pressable accessibilityLabel="Seçim penceresini kapat" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView
          edges={['bottom']}
          style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.sheetHeader}>
            <View style={[styles.sheetIcon, { backgroundColor: colors.surfaceMuted }]}>
              <SymbolView
                name={{ ios: 'slider.horizontal.3', android: 'tune', web: 'tune' }}
                size={20}
                tintColor={colors.primary}
              />
            </View>
            <View style={styles.sheetCopy}>
              <AppText variant="sectionTitle">{title}</AppText>
              <AppText color="textMuted" variant="bodySmall">{description}</AppText>
            </View>
          </View>
          <View style={styles.sheetOptions}>
            {options.map((option) => {
              const selected = option.value === selectedValue;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [
                    styles.sheetOption,
                    {
                      backgroundColor: selected ? colors.surfaceMuted : colors.background,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <AppText style={styles.sheetOptionLabel} variant="label">{option.label}</AppText>
                  <SymbolView
                    name={{
                      ios: selected ? 'checkmark.circle.fill' : 'circle',
                      android: selected ? 'radio_button_checked' : 'radio_button_unchecked',
                      web: selected ? 'radio_button_checked' : 'radio_button_unchecked',
                    }}
                    size={22}
                    tintColor={selected ? colors.primary : colors.textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: layout.screenHorizontalPadding },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: spacing.sm },
  card: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 56, paddingHorizontal: spacing.xs },
  icon: { alignItems: 'center', borderRadius: radius.pill, height: 32, justifyContent: 'center', width: 32 },
  label: { flex: 1, fontSize: 14, lineHeight: 19, marginLeft: spacing.sm },
  value: { marginRight: spacing.xs },
  pressed: { opacity: 0.68 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    backgroundColor: 'rgba(12, 8, 5, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: { alignSelf: 'center', borderRadius: radius.pill, height: 4, marginBottom: spacing.lg, width: 44 },
  sheetHeader: { alignItems: 'center', flexDirection: 'row' },
  sheetIcon: { alignItems: 'center', borderRadius: radius.pill, height: 44, justifyContent: 'center', width: 44 },
  sheetCopy: { flex: 1, gap: spacing.xxs, marginLeft: spacing.sm },
  sheetOptions: { gap: spacing.xs, marginTop: spacing.lg },
  sheetOption: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  sheetOptionLabel: { flex: 1 },
});
