import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicBarber } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarberPreviewCardProps = {
  barber: PublicBarber;
  onPress: () => void;
};

export function BarberPreviewCard({ barber, onPress }: BarberPreviewCardProps) {
  const fullName = `${barber.user.firstName} ${barber.user.lastName}`;
  const initials = `${barber.user.firstName[0] ?? ''}${barber.user.lastName[0] ?? ''}`;

  return (
    <Pressable
      accessibilityLabel={`${fullName} berber profilini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        {barber.user.profileImageUrl ? (
          <Image
            accessibilityLabel={`${fullName} profil fotoğrafı`}
            contentFit="cover"
            source={barber.user.profileImageUrl}
            style={styles.avatar}
            transition={150}
          />
        ) : (
          <View style={styles.placeholder}>
            <AppText color="primary" variant="label">{initials}</AppText>
          </View>
        )}
        <View style={styles.content}>
          <AppText variant="label">{fullName}</AppText>
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            Randevuya açık
          </AppText>
        </View>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={18}
          tintColor={colors.textMuted}
        />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  card: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xs },
  avatar: { borderRadius: radius.pill, height: 48, width: 48 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  content: { flex: 1, marginLeft: spacing.sm },
  meta: { marginTop: 2 },
});
