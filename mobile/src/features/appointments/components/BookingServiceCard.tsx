import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { PublicService } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BookingServiceCardProps = {
  isSelected: boolean;
  onPress: () => void;
  service: PublicService;
  showDivider: boolean;
};

export function BookingServiceCard({
  isSelected,
  onPress,
  service,
  showDivider,
}: BookingServiceCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <View style={styles.row}>
        <View style={styles.content}>
          <AppText variant="label">{service.name}</AppText>
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            {service.durationMinutes} dk
          </AppText>
        </View>
        <AppText variant="label">₺{service.price}</AppText>
        <View style={[styles.radio, isSelected && styles.selectedRadio]}>
          {isSelected ? (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={13}
              tintColor={colors.onPrimary}
            />
          ) : null}
        </View>
      </View>
      {showDivider ? <View style={styles.divider} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  content: { flex: 1 },
  meta: { marginTop: 2 },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 20,
    justifyContent: 'center',
    marginLeft: spacing.sm,
    width: 20,
  },
  selectedRadio: { backgroundColor: colors.primary, borderColor: colors.primary },
  divider: { backgroundColor: colors.border, height: 1, marginHorizontal: spacing.md },
});
