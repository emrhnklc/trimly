import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessManagementState({
  description,
  onRetry,
  title,
}: {
  description: string;
  onRetry: () => void;
  title: string;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <SymbolView
          name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
          size={27}
          tintColor={colors.danger}
        />
      </View>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      <AppText color="textMuted" style={styles.description}>{description}</AppText>
      <View style={styles.action}>
        <AppButton onPress={onRetry} variant="secondary">Tekrar Dene</AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxxl },
  icon: {
    alignItems: 'center',
    backgroundColor: '#F8E8E5',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  title: { marginTop: spacing.md, textAlign: 'center' },
  description: { marginTop: spacing.xs, maxWidth: 310, textAlign: 'center' },
  action: { marginTop: spacing.lg, minWidth: 180 },
});
