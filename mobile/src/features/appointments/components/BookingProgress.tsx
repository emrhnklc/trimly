import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export type BookingStep = 1 | 2 | 3 | 4;

const steps: { label: string; value: BookingStep }[] = [
  { label: 'Hizmet', value: 1 },
  { label: 'Çalışan', value: 2 },
  { label: 'Tarih & Saat', value: 3 },
  { label: 'Onay', value: 4 },
];

export function BookingProgress({ activeStep = 0 }: { activeStep?: 0 | BookingStep }) {
  return (
    <View accessibilityLabel={`Randevu ilerlemesi: ${activeStep ? `${activeStep}. adım` : 'başlangıç'}`}>
      <View style={styles.track}>
        {steps.map((step) => (
          <View
            key={step.value}
            style={[styles.segment, step.value <= activeStep && styles.activeSegment]}
          />
        ))}
      </View>
      {activeStep ? (
        <AppText color="primary" style={styles.label} variant="overline">
          {activeStep}. ADIM · {steps[activeStep - 1].label.toLocaleUpperCase('tr-TR')}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: spacing.xxs, justifyContent: 'center' },
  segment: {
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    height: 4,
    width: 28,
  },
  activeSegment: { backgroundColor: colors.primary },
  label: { fontSize: 9, lineHeight: 12, marginTop: spacing.xxs, textAlign: 'center' },
});
