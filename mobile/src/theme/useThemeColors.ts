import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { colors, darkColors } from '@/theme/colors';

export function useThemeColors() {
  const { resolvedTheme } = useAppPreferences();
  return resolvedTheme === 'dark' ? darkColors : colors;
}
