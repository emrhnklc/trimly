import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { BookableBarber } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BookingBarberCardProps = {
  barber: BookableBarber;
  isSelected: boolean;
  onPress: () => void;
};

export function BookingBarberCard({ barber, isSelected, onPress }: BookingBarberCardProps) {
  const name = `${barber.user.firstName} ${barber.user.lastName}`;
  const initials = `${barber.user.firstName[0] ?? ''}${barber.user.lastName[0] ?? ''}`;

  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: isSelected }} onPress={onPress}>
      <AppCard style={[styles.card, isSelected && styles.selectedCard]}>
        {barber.user.profileImageUrl ? (
          <Image contentFit="cover" source={barber.user.profileImageUrl} style={styles.avatar} transition={150} />
        ) : (
          <View style={styles.placeholder}>
            <AppText color="primary" variant="label">{initials}</AppText>
          </View>
        )}
        <View style={styles.content}>
          <AppText variant="label">{name}</AppText>
          <AppText color={isSelected ? 'primary' : 'textMuted'} style={styles.meta} variant="bodySmall">
            {isSelected ? 'Seçildi' : 'Bu hizmet için uygun'}
          </AppText>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  selectedCard: { borderColor: colors.primary },
  avatar: { borderRadius: radius.pill, height: 40, width: 40 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  meta: { marginTop: 2 },
});
