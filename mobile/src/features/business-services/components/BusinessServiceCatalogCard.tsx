import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicService } from '@/features/barbershops/types';
import { formatTurkishPrice } from '@/features/business-management/format';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessServiceCatalogCard({ service }: { service: PublicService }) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView
          name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
          size={20}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.name} variant="label">{service.name}</AppText>
        {service.description ? (
          <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
            {service.description}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <AppText color="textMuted" style={styles.duration} variant="bodySmall">
            {service.durationMinutes} dk
          </AppText>
          <View style={styles.dot} />
          <AppText color="primary" style={styles.price} variant="label">
            {formatTurkishPrice(service.price)}
          </AppText>
        </View>
      </View>
      <View style={styles.readOnlyBadge}>
        <AppText color="textMuted" style={styles.readOnlyText} variant="overline">
          GÖRÜNTÜLE
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 94,
    padding: spacing.sm,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: 14, lineHeight: 19 },
  description: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  metaRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs },
  duration: { fontSize: 10, lineHeight: 14 },
  dot: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 3,
    marginHorizontal: 6,
    width: 3,
  },
  price: { fontSize: 11, lineHeight: 15 },
  readOnlyBadge: {
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  readOnlyText: { fontSize: 7, lineHeight: 10 },
});
