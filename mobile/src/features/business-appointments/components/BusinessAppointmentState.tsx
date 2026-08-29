import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BusinessAppointmentStateProps = {
  description: string;
  error?: boolean;
  onRetry?: () => void;
  title: string;
};

export function BusinessAppointmentState({
  description,
  error = false,
  onRetry,
  title,
}: BusinessAppointmentStateProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconShell, error && styles.errorIconShell]}>
        <SymbolView
          name={error
            ? { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }
            : { ios: 'calendar', android: 'event_available', web: 'event_available' }}
          size={27}
          tintColor={error ? colors.danger : colors.primary}
        />
      </View>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.description}>{description}</AppText>
      {onRetry ? (
        <View style={styles.action}>
          <AppButton onPress={onRetry} variant="secondary">Tekrar Dene</AppButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  errorIconShell: { backgroundColor: '#F8E8E5' },
  title: { marginTop: spacing.md, textAlign: 'center' },
  description: { marginTop: spacing.xs, maxWidth: 310, textAlign: 'center' },
  action: { marginTop: spacing.lg, minWidth: 180 },
});
