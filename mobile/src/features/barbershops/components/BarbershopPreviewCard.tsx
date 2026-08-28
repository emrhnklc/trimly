import { Image, Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicBarbershop } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopPreviewCardProps = {
  barbershop: PublicBarbershop;
  onPress: () => void;
};

export function BarbershopPreviewCard({ barbershop, onPress }: BarbershopPreviewCardProps) {
  const initial = barbershop.name.slice(0, 1).toUpperCase();

  return (
    <Pressable
      accessibilityLabel={`${barbershop.name} profilini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        {barbershop.profileImageUrl ? (
          <Image
            accessibilityLabel={`${barbershop.name} profil görseli`}
            source={{ uri: barbershop.profileImageUrl }}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <AppText color="primary" variant="displayMedium">{initial}</AppText>
          </View>
        )}

        <View style={styles.content}>
          <AppText numberOfLines={1} variant="label">{barbershop.name}</AppText>
          <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
            {barbershop.description || 'Hizmetleri ve randevu seçeneklerini incele.'}
          </AppText>
          {barbershop.address ? (
            <View style={styles.addressRow}>
              <SymbolView
                name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
                size={14}
                tintColor={colors.primary}
              />
              <AppText color="primary" numberOfLines={1} style={styles.address} variant="bodySmall">
                {barbershop.address}
              </AppText>
            </View>
          ) : null}
        </View>

        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={20}
          tintColor={colors.textMuted}
        />
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.78 },
  card: { alignItems: 'center', flexDirection: 'row', minHeight: 112 },
  image: {
    borderRadius: radius.md,
    height: 68,
    marginRight: spacing.sm,
    width: 68,
  },
  placeholderImage: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 68,
    justifyContent: 'center',
    marginRight: spacing.sm,
    width: 68,
  },
  content: { flex: 1, marginRight: spacing.xs },
  description: { marginTop: spacing.xxs },
  addressRow: { alignItems: 'center', flexDirection: 'row', marginTop: 6 },
  address: { flex: 1, marginLeft: spacing.xxs },
});
