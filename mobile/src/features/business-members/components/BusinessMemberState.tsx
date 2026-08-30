import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessMemberState({
  actionLabel,
  description,
  error = false,
  onAction,
  title,
}: {
  actionLabel?: string;
  description: string;
  error?: boolean;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconShell, error && styles.errorIcon]}>
        <SymbolView
          name={error
            ? { ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }
            : { ios: 'person.2', android: 'group', web: 'group' }}
          size={27}
          tintColor={error ? colors.danger : colors.primary}
        />
      </View>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.description}>{description}</AppText>
      {onAction && actionLabel ? (
        <View style={styles.action}>
          <AppButton onPress={onAction} variant="secondary">{actionLabel}</AppButton>
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
  errorIcon: { backgroundColor: '#F8E8E5' },
  title: { marginTop: spacing.md, textAlign: 'center' },
  description: { marginTop: spacing.xs, maxWidth: 310, textAlign: 'center' },
  action: { marginTop: spacing.lg, minWidth: 180 },
});
