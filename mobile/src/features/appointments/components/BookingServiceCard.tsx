import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicService } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BookingServiceCardProps = {
  isSelected: boolean;
  onPress: () => void;
  service: PublicService;
};

export function BookingServiceCard({ isSelected, onPress, service }: BookingServiceCardProps) {
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: isSelected }} onPress={onPress}>
      <AppCard style={[styles.card, isSelected && styles.selectedCard]}>
        <View style={styles.content}>
          <AppText variant="label">{service.name}</AppText>
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            {service.durationMinutes} dk
          </AppText>
        </View>
        <AppText color="primary" variant="label">₺{service.price}</AppText>
        <View style={[styles.radio, isSelected && styles.selectedRadio]}>
          {isSelected ? (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={13}
              tintColor={colors.onPrimary}
            />
          ) : null}
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xs },
  selectedCard: { borderColor: colors.primary, borderWidth: 2 },
  content: { flex: 1 },
  meta: { marginTop: spacing.xxs },
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
});
