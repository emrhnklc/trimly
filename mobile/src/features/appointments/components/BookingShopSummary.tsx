import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BookingShopSummaryProps = {
  shop: PublicBarbershopDetail;
};

export function BookingShopSummary({ shop }: BookingShopSummaryProps) {
  return (
    <AppCard style={styles.card}>
      {shop.profileImageUrl ? (
        <Image
          accessibilityLabel={`${shop.name} işletme görseli`}
          contentFit="cover"
          source={shop.profileImageUrl}
          style={styles.image}
          transition={150}
        />
      ) : (
        <View style={styles.placeholder}>
          <AppText color="primary" style={styles.initial} variant="displayMedium">
            {shop.name.slice(0, 1).toUpperCase()}
          </AppText>
        </View>
      )}

      <View style={styles.content}>
        <AppText style={styles.name} variant="displayMedium">{shop.name}</AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.address} variant="bodySmall">
          {shop.address || 'Adres bilgisi eklenmemiş.'}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', padding: spacing.sm },
  image: { borderRadius: radius.pill, height: 58, width: 58 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  initial: { fontSize: 24, lineHeight: 30 },
  content: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: 20, lineHeight: 25 },
  address: { marginTop: spacing.xxs },
});
