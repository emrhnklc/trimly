import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessCustomerState({
  description,
  error = false,
  onRetry,
  title,
}: {
  description: string;
  error?: boolean;
  onRetry?: () => void;
  title: string;
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.icon, error && styles.errorIcon]}>
        <SymbolView
          name={error
            ? { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }
            : { ios: 'person.2', android: 'group', web: 'group' }}
          size={26}
          tintColor={error ? colors.danger : colors.primary}
        />
      </View>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.description} variant="bodySmall">
        {description}
      </AppText>
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
  icon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  errorIcon: { backgroundColor: '#F8E8E5' },
  title: { fontSize: 17, lineHeight: 23, marginTop: spacing.md, textAlign: 'center' },
  description: { marginTop: spacing.xs, maxWidth: 300, textAlign: 'center' },
  action: { marginTop: spacing.lg, minWidth: 180 },
});
