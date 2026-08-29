import type { SymbolViewProps } from 'expo-symbols';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { BusinessScreenHeader } from './BusinessScreenHeader';

type BusinessPlaceholderScreenProps = {
  description: string;
  icon: SymbolViewProps['name'];
  title: string;
};

export function BusinessPlaceholderScreen({
  description,
  icon,
  title,
}: BusinessPlaceholderScreenProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <BusinessScreenHeader title={title} />
        <AppCard style={styles.card}>
          <View style={styles.iconShell}>
            <SymbolView name={icon} size={28} tintColor={colors.primary} />
          </View>
          <AppText style={styles.cardTitle} variant="heading">{title} sırada</AppText>
          <AppText color="textMuted" style={styles.description}>{description}</AppText>
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing.lg },
  card: { alignItems: 'center', marginTop: spacing.xxl, padding: spacing.xl },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  cardTitle: { marginTop: spacing.md },
  description: { marginTop: spacing.xs, maxWidth: 310, textAlign: 'center' },
});
