import { StyleSheet, View } from 'react-native';

import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import {
  BookingProgress,
  type BookingStep,
} from '@/features/appointments/components/BookingProgress';
import { spacing } from '@/theme/spacing';

export function BookingFlowHeader({
  activeStep = 0,
  onClose,
  title = 'Randevu Al',
}: {
  activeStep?: 0 | BookingStep;
  onClose: () => void;
  title?: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <AppIconButton
          accessibilityLabel="Randevu akışını kapat"
          icon={{ ios: 'xmark', android: 'close', web: 'close' }}
          onPress={onClose}
          variant="transparent"
        />
        <AppText style={styles.title} variant="heading">{title}</AppText>
        <View style={styles.spacer} />
      </View>
      <BookingProgress activeStep={activeStep} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingBottom: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.xxs },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { flex: 1, textAlign: 'center' },
  spacer: { width: 44 },
});
