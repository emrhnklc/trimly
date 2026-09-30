import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export type BookingStep = 1 | 2 | 3 | 4 | 5 | 6;

const steps: { label: string; value: BookingStep }[] = [
  { label: 'Kişi', value: 1 },
  { label: 'İşletme', value: 2 },
  { label: 'Hizmet', value: 3 },
  { label: 'Çalışan', value: 4 },
  { label: 'Tarih & Saat', value: 5 },
  { label: 'Onay', value: 6 },
];

export function BookingProgress({ activeStep = 0 }: { activeStep?: 0 | BookingStep }) {
  const colors = useThemeColors();
  return (
    <View accessibilityLabel={`Randevu ilerlemesi: ${activeStep ? `${activeStep}. adım` : 'başlangıç'}`}>
      <View style={styles.track}>
        {steps.map((step) => (
          <View
            key={step.value}
            style={[
              styles.segment,
              { backgroundColor: step.value <= activeStep ? colors.primary : colors.border },
            ]}
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
    borderRadius: radius.pill,
    height: 4,
    width: 24,
  },
  label: { fontSize: 9, lineHeight: 12, marginTop: spacing.xxs, textAlign: 'center' },
});
