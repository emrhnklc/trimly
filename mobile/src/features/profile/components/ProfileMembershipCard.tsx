import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ProfileMembershipCard() {
  return (
    <View style={styles.card}>
      <Image
        contentFit="cover"
        source={require('../../../../assets/images/home/discover-barbershop.png')}
        style={styles.background}
      />
      <View style={styles.overlay} />
      <AppText color="surface" variant="heading">Trimly Plus</AppText>
      <AppText color="primary" style={styles.status} variant="label">ÇOK YAKINDA</AppText>
      <AppText color="surfaceMuted" style={styles.description} variant="bodySmall">
        Otomatik randevu ve kişisel stil avantajları.
      </AppText>
      <View style={styles.badge}>
        <AppText color="onPrimary" variant="bodySmall">Avantajlar hazırlanıyor</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    marginTop: spacing.lg,
    minHeight: 150,
    overflow: 'hidden',
    padding: spacing.md,
  },
  background: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  overlay: {
    backgroundColor: 'rgba(14, 9, 6, 0.2)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  status: { marginTop: 2 },
  description: { marginTop: spacing.xs, maxWidth: 230 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    marginTop: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
