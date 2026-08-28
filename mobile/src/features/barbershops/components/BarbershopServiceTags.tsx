import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { PublicService } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BarbershopServiceTags({ services }: { services: PublicService[] }) {
  if (!services.length) {
    return <AppText color="textMuted">Henüz aktif hizmet eklenmemiş.</AppText>;
  }

  return (
    <View style={styles.tags}>
      {services.map((service) => (
        <View key={service.id} style={styles.tag}>
          <AppText variant="bodySmall">{service.name}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tag: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
