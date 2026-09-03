import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useBusiness } from '@/features/business/BusinessProvider';
import type { BusinessPermission } from '@/features/business/permissions';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BusinessTabName =
  | 'index'
  | 'calendar'
  | 'services'
  | 'customers'
  | 'management'
  | 'profile';

type BusinessTabConfig = {
  icon: SymbolViewProps['name'];
  label: string;
  permission: BusinessPermission;
};

const tabs: Record<BusinessTabName, BusinessTabConfig> = {
  index: {
    icon: { ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' },
    label: 'Randevular',
    permission: 'VIEW_OWN_APPOINTMENTS',
  },
  calendar: {
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    label: 'Takvim',
    permission: 'VIEW_OWN_SCHEDULE',
  },
  services: {
    icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
    label: 'Hizmetler',
    permission: 'VIEW_SERVICE_CATALOG',
  },
  customers: {
    icon: { ios: 'person.2', android: 'group', web: 'group' },
    label: 'Müşteriler',
    permission: 'VIEW_CUSTOMERS',
  },
  management: {
    icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
    label: 'Yönetim',
    permission: 'MANAGE_SERVICES',
  },
  profile: {
    icon: { ios: 'person', android: 'person', web: 'person' },
    label: 'Profil',
    permission: 'ACCESS_BUSINESS_MODE',
  },
};

function isBusinessTabName(name: string): name is BusinessTabName {
  return name in tabs;
}

export function BusinessTabBar({ descriptors, navigation, state }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { can } = useBusiness();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      {state.routes.map((route, index) => {
        if (!isBusinessTabName(route.name)) return null;

        const tab = tabs[route.name];
        if (!can(tab.permission)) return null;
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
            <SymbolView
              name={tab.icon}
              size={21}
              tintColor={isFocused ? colors.primary : colors.textMuted}
            />
            <AppText
              color={isFocused ? 'primary' : 'textMuted'}
              numberOfLines={1}
              style={styles.label}
              variant="bodySmall">
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
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 52 },
  label: { fontSize: 9, lineHeight: 13, textAlign: 'center' },
  pressed: { opacity: 0.66 },
});
