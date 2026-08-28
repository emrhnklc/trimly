import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicService } from '@/features/barbershops/types';
import { spacing } from '@/theme/spacing';

type ServicePreviewCardProps = {
  service: PublicService;
};

export function ServicePreviewCard({ service }: ServicePreviewCardProps) {
  return (
    <AppCard style={styles.card}>
      <View style={styles.row}>
        <View style={styles.content}>
          <AppText variant="label">{service.name}</AppText>
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            {service.durationMinutes} dk
            {service.description ? ` · ${service.description}` : ''}
          </AppText>
        </View>
        <AppText color="primary" variant="label">₺{service.price}</AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.xs },
  row: { alignItems: 'center', flexDirection: 'row' },
  content: { flex: 1, marginRight: spacing.sm },
  meta: { marginTop: spacing.xxs },
});
