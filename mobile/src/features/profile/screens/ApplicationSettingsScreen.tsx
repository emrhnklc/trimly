import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
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

export function ApplicationSettingsScreen() {
  const colors = useThemeColors();
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

  function chooseTheme() {
    Alert.alert(
      translate('Tema', 'Theme'),
      translate('Uygulamanın görünümünü seç.', 'Choose the app appearance.'),
      [
        { text: translate('Sistem', 'System'), onPress: () => void setThemePreference('system') },
        { text: translate('Açık', 'Light'), onPress: () => void setThemePreference('light') },
        { text: translate('Koyu', 'Dark'), onPress: () => void setThemePreference('dark') },
        { text: translate('Vazgeç', 'Cancel'), style: 'cancel' },
      ],
    );
  }

  function chooseLanguage() {
    Alert.alert(
      translate('Dil', 'Language'),
      translate('Uygulama dilini seç.', 'Choose the app language.'),
      [
        { text: 'Türkçe', onPress: () => void setLanguage('tr') },
        { text: 'English', onPress: () => void setLanguage('en') },
        { text: translate('Vazgeç', 'Cancel'), style: 'cancel' },
      ],
    );
  }

  function showLocationInfo() {
    Alert.alert(
      translate('Konum', 'Location'),
      translate(
        'Konum tercihini yakındaki işletmeler özelliğiyle birlikte açacağız.',
        'Location preferences will be enabled with nearby business discovery.',
      ),
    );
  }

  const options: PreferenceRow[] = [
    {
      icon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
      label: translate('Tema', 'Theme'),
      onPress: chooseTheme,
      value: themeLabels[themePreference],
    },
    {
      icon: { ios: 'globe', android: 'language', web: 'language' },
      label: translate('Dil', 'Language'),
      onPress: chooseLanguage,
      value: languageLabels[language],
    },
    {
      icon: { ios: 'location', android: 'location_on', web: 'location_on' },
      isLast: true,
      label: translate('Konum', 'Location'),
      onPress: showLocationInfo,
      value: translate('Otomatik', 'Automatic'),
    },
  ];

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title={translate('Uygulama Ayarları', 'App Settings')} />

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
    </Screen>
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
});
