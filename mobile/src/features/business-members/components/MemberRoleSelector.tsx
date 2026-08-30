import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessMemberRole } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type AssignableBusinessRole = Exclude<BusinessMemberRole, 'OWNER'>;

const roles: {
  description: string;
  icon: SymbolViewProps['name'];
  label: string;
  value: AssignableBusinessRole;
}[] = [
  {
    description: 'İşletme, ekip, hizmet ve randevuları yönetebilir.',
    icon: { ios: 'person.badge.key', android: 'admin_panel_settings', web: 'admin_panel_settings' },
    label: 'Yönetici',
    value: 'MANAGER',
  },
  {
    description: 'Kendi randevularını ve müşteri işlemlerini yönetir.',
    icon: { ios: 'scissors', android: 'content_cut', web: 'content_cut' },
    label: 'Berber',
    value: 'BARBER',
  },
  {
    description: 'Salt-okunur çalışan görünümünü kullanır, randevu alamaz.',
    icon: { ios: 'book.closed', android: 'menu_book', web: 'menu_book' },
    label: 'Çırak',
    value: 'APPRENTICE',
  },
];

export function MemberRoleSelector({
  disabled = false,
  onChange,
  value,
}: {
  disabled?: boolean;
  onChange: (role: AssignableBusinessRole) => void;
  value: AssignableBusinessRole;
}) {
  return (
    <View style={styles.list}>
      {roles.map((role) => {
        const selected = value === role.value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            disabled={disabled}
            key={role.value}
            onPress={() => onChange(role.value)}
            style={({ pressed }) => [
              styles.card,
              selected && styles.selectedCard,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.iconShell, selected && styles.selectedIcon]}>
              <SymbolView name={role.icon} size={19} tintColor={selected ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.content}>
              <AppText style={styles.label} variant="label">{role.label}</AppText>
              <AppText color="textMuted" style={styles.description} variant="bodySmall">
                {role.description}
              </AppText>
            </View>
            <View style={[styles.radio, selected && styles.selectedRadio]}>
              {selected ? <View style={styles.radioDot} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.xs },
  card: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 76,
    padding: spacing.sm,
  },
  selectedCard: { backgroundColor: '#FCF5E6', borderColor: colors.primary },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  selectedIcon: { backgroundColor: '#F4E7C8' },
  content: { flex: 1, marginHorizontal: spacing.sm },
  label: { fontSize: 12, lineHeight: 16 },
  description: { fontSize: 9, lineHeight: 13, marginTop: 2 },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 20,
    justifyContent: 'center',
    width: 20,
  },
  selectedRadio: { borderColor: colors.primary },
  radioDot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 10, width: 10 },
  pressed: { opacity: 0.68 },
});
