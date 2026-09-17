import * as SecureStore from 'expo-secure-store';
import {
  Appearance,
  useColorScheme,
} from 'react-native';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type AppLanguage = 'en' | 'tr';
export type ThemePreference = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

type AppPreferencesContextValue = {
  language: AppLanguage;
  resolvedTheme: ResolvedTheme;
  setLanguage: (language: AppLanguage) => Promise<void>;
  setThemePreference: (theme: ThemePreference) => Promise<void>;
  themePreference: ThemePreference;
  translate: (turkish: string, english: string) => string;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);
const languageStorageKey = 'trimly.preferences.language';
const themeStorageKey = 'trimly.preferences.theme';

export function AppPreferencesProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [language, setLanguageState] = useState<AppLanguage>('tr');
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  const [isReady, setReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function restorePreferences() {
      try {
        const [savedLanguage, savedTheme] = await Promise.all([
          SecureStore.getItemAsync(languageStorageKey),
          SecureStore.getItemAsync(themeStorageKey),
        ]);
        if (!isMounted) return;
        if (savedLanguage === 'en' || savedLanguage === 'tr') setLanguageState(savedLanguage);
        if (savedTheme === 'dark' || savedTheme === 'light' || savedTheme === 'system') {
          setThemePreferenceState(savedTheme);
          Appearance.setColorScheme(savedTheme === 'system' ? 'unspecified' : savedTheme);
        }
      } catch {
        // Varsayılan tercihlerle devam et.
      } finally {
        if (isMounted) setReady(true);
      }
    }

    void restorePreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  const resolvedTheme: ResolvedTheme =
    themePreference === 'system' && systemScheme === 'dark' ? 'dark' :
      themePreference === 'dark' ? 'dark' : 'light';

  const value = useMemo<AppPreferencesContextValue>(() => ({
    language,
    resolvedTheme,
    async setLanguage(nextLanguage) {
      await SecureStore.setItemAsync(languageStorageKey, nextLanguage);
      setLanguageState(nextLanguage);
    },
    async setThemePreference(nextTheme) {
      await SecureStore.setItemAsync(themeStorageKey, nextTheme);
      Appearance.setColorScheme(nextTheme === 'system' ? 'unspecified' : nextTheme);
      setThemePreferenceState(nextTheme);
    },
    themePreference,
    translate: (turkish, english) => language === 'en' ? english : turkish,
  }), [language, resolvedTheme, themePreference]);

  if (!isReady) return null;

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('useAppPreferences AppPreferencesProvider içinde kullanılmalı.');
  return context;
}
