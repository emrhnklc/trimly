import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { useBusiness } from '@/features/business/BusinessProvider';
import type { BusinessPermission } from '@/features/business/permissions';
import { useAppPreferences } from '@/features/preferences/AppPreferencesProvider';
import { spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BusinessTabName =
  | 'index'
  | 'calendar'
  | 'services'
  | 'customers'
  | 'management'
  | 'profile';

type BusinessTabConfig = {
  icon: SymbolViewProps['name'];
  label: { en: string; tr: string };
  permission: BusinessPermission;
};

const tabs: Record<BusinessTabName, BusinessTabConfig> = {
  index: {
    icon: { ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' },
    label: { en: 'Appointments', tr: 'Randevular' },
    permission: 'VIEW_OWN_APPOINTMENTS',
  },
  calendar: {
    icon: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
    label: { en: 'Calendar', tr: 'Takvim' },
    permission: 'VIEW_OWN_SCHEDULE',
  },
  services: {
    icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
    label: { en: 'Services', tr: 'Hizmetler' },
    permission: 'VIEW_SERVICE_CATALOG',
  },
  customers: {
    icon: { ios: 'person.2', android: 'group', web: 'group' },
    label: { en: 'Customers', tr: 'Müşteriler' },
    permission: 'VIEW_CUSTOMERS',
  },
  management: {
    icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
    label: { en: 'Manage', tr: 'Yönetim' },
    permission: 'MANAGE_SERVICES',
  },
  profile: {
    icon: { ios: 'person', android: 'person', web: 'person' },
    label: { en: 'Profile', tr: 'Profil' },
    permission: 'ACCESS_BUSINESS_MODE',
  },
};

function isBusinessTabName(name: string): name is BusinessTabName {
  return name in tabs;
}

export function BusinessTabBar({ descriptors, navigation, state, setupMode = false }: BottomTabBarProps & { setupMode?: boolean }) {
  const insets = useSafeAreaInsets();
  const { can } = useBusiness();
  const colors = useThemeColors();
  const { language } = useAppPreferences();

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
        if (!isBusinessTabName(route.name)) return null;
        const tab = tabs[route.name];
        if (!can(tab.permission)) return null;
        const label = tab.label[language];
        const isFocused = state.index === index;
        const isSetupLocked = setupMode && route.name !== 'management' && route.name !== 'profile';
        const { options } = descriptors[route.key];

        function handlePress() {
          if (isSetupLocked) {
            Alert.alert(
              'Önce kurulumu tamamla',
              'Bu bölüm işletmeni yayınladıktan sonra açılacak. Eksik adımları Yönetim ekranından tamamlayabilirsin.',
            );
            return;
          }
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
            accessibilityState={{ disabled: isSetupLocked, selected: isFocused }}
            key={route.key}
            onLongPress={() => navigation.emit({ target: route.key, type: 'tabLongPress' })}
            onPress={handlePress}
            style={({ pressed }) => [styles.item, isSetupLocked && styles.locked, pressed && !isSetupLocked && styles.pressed]}>
            <SymbolView
              name={tab.icon}
              size={21}
              tintColor={isSetupLocked ? colors.border : isFocused ? colors.primary : colors.textMuted}
            />
            <AppText
              color={isSetupLocked ? 'textMuted' : isFocused ? 'primary' : 'textMuted'}
              numberOfLines={1}
              style={styles.label}
              variant="bodySmall">
              {label}
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
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  item: { alignItems: 'center', flex: 1, gap: 2, justifyContent: 'center', minHeight: 52 },
  label: { fontSize: 9, lineHeight: 13, textAlign: 'center' },
  pressed: { opacity: 0.66 },
  locked: { opacity: 0.42 },
});
