import { Image, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopPreviewCardProps = {
  barbershop: PublicBarbershop;
};

export function BarbershopPreviewCard({ barbershop }: BarbershopPreviewCardProps) {
  const initial = barbershop.name.slice(0, 1).toUpperCase();

  return (
    <AppCard style={styles.card}>
      {barbershop.profileImageUrl ? (
        <Image accessibilityLabel={`${barbershop.name} profil görseli`} source={{ uri: barbershop.profileImageUrl }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <AppText color="primary" variant="displayMedium">
            {initial}
          </AppText>
        </View>
      )}

      <View style={styles.content}>
        <AppText numberOfLines={1} variant="label">
          {barbershop.name}
        </AppText>
        <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
          {barbershop.description || 'Randevu için profili incele.'}
        </AppText>
        {barbershop.address ? (
          <AppText color="primary" numberOfLines={1} style={styles.address} variant="bodySmall">
            {barbershop.address}
          </AppText>
        ) : null}
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={20}
        tintColor={colors.textMuted}
      />
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', minHeight: 104 },
  image: {
    borderRadius: radius.md,
    height: 56,
    marginRight: spacing.sm,
    width: 56,
  },
  placeholderImage: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 56,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 56,
  },
  content: { flex: 1, marginRight: spacing.xs },
  description: { marginTop: spacing.xxs },
  address: { marginTop: 6 },
});
