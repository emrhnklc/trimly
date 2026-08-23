import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type TabName = 'index' | 'barbers' | 'book' | 'appointments' | 'profile';

type TabConfig = {
  icon: SymbolViewProps['name'];
  label: string;
  primary?: boolean;
};

const tabs: Record<TabName, TabConfig> = {
  index: { icon: { ios: 'house.fill', android: 'home', web: 'home' }, label: 'Ana Sayfa' },
  barbers: { icon: { ios: 'person.2', android: 'group', web: 'group' }, label: 'Berberler' },
  book: {
    icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
    label: 'Randevu al',
    primary: true,
  },
  appointments: {
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    label: 'Randevularım',
  },
  profile: { icon: { ios: 'person', android: 'person', web: 'person' }, label: 'Profilim' },
};

function isTabName(name: string): name is TabName {
  return name in tabs;
}

export function TrimlyTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {state.routes.map((route, index) => {
        if (!isTabName(route.name)) return null;

        const tab = tabs[route.name];
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
            accessibilityLabel={options.tabBarAccessibilityLabel ?? tab.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: isFocused }}
            key={route.key}
            onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
            onPress={handlePress}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            {tab.primary ? (
              <View style={[styles.primaryIcon, isFocused && styles.primaryIconFocused]}>
                <SymbolView name={tab.icon} size={25} tintColor={colors.onPrimary} />
              </View>
            ) : (
              <SymbolView name={tab.icon} size={22} tintColor={isFocused ? colors.primary : colors.textMuted} />
            )}
            <AppText color={isFocused ? 'primary' : 'textMuted'} style={styles.label} variant="bodySmall">
              {tab.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 52 },
  label: { fontSize: 10, lineHeight: 14, textAlign: 'center' },
  primaryIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    marginTop: -28,
    width: 48,
  },
  primaryIconFocused: { backgroundColor: colors.primaryPressed },
  pressed: { opacity: 0.72 },
});
