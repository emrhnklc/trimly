import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type TabName = 'index' | 'barbers' | 'book' | 'appointments' | 'profile';

type TabConfig = {
  icon: SymbolViewProps['name'];
  label: { en: string; tr: string };
  primary?: boolean;
};

const tabs: Record<TabName, TabConfig> = {
  index: { icon: { ios: 'house.fill', android: 'home', web: 'home' }, label: { en: 'Home', tr: 'Ana Sayfa' } },
  barbers: { icon: { ios: 'person.2', android: 'group', web: 'group' }, label: { en: 'Barbers', tr: 'Berberler' } },
  book: {
    icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
    label: { en: 'Book', tr: 'Randevu al' },
    primary: true,
  },
  appointments: {
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    label: { en: 'Appointments', tr: 'Randevularım' },
  },
  profile: { icon: { ios: 'person', android: 'person', web: 'person' }, label: { en: 'Profile', tr: 'Profilim' } },
};

function isTabName(name: string): name is TabName {
  return name in tabs;
}

export function TrimlyTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const { language } = useAppPreferences();

  if (state.routes[state.index]?.name === 'book') return null;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingBottom: Math.max(insets.bottom, spacing.xs),
        },
      ]}>
      {state.routes.map((route, index) => {
        if (!isTabName(route.name)) return null;

        const tab = tabs[route.name];
        const label = tab.label[language];
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];

        function handlePress() {
          const event = navigation.emit({
            canPreventDefault: true,
            target: route.key,
            type: 'tabPress',
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        }

        return (
          <Pressable
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            key={route.key}
            onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
            onPress={handlePress}
            style={({ pressed }) => [styles.item, tab.primary && styles.primaryItem, pressed && styles.pressed]}>
            {tab.primary ? (
              <View
                style={[
                  styles.primaryIcon,
                  { backgroundColor: isFocused ? colors.primaryPressed : colors.primary },
                ]}>
                <SymbolView name={tab.icon} size={29} style={styles.primaryScissors} tintColor={colors.onPrimary} />
              </View>
            ) : (
              <SymbolView name={tab.icon} size={22} tintColor={isFocused ? colors.primary : colors.textMuted} />
            )}
            {!tab.primary ? (
              <AppText allowFontScaling={false} color={isFocused ? 'primary' : 'textMuted'} numberOfLines={1} style={styles.label} variant="bodySmall">
                {label}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 52 },
  primaryItem: { flex: 0.65 },
  label: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  primaryIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    marginTop: -32,
    width: 56,
  },
  primaryScissors: { transform: [{ rotate: '-90deg' }] },
  pressed: { opacity: 0.72 },
});
