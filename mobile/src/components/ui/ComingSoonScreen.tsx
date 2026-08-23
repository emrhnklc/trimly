import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { AppCard } from './AppCard';
import { AppText } from './AppText';
import { Screen } from './Screen';

type ComingSoonScreenProps = { description: string; title: string };

export function ComingSoonScreen({ description, title }: ComingSoonScreenProps) {
  return (
    <Screen>
      <View style={styles.content}>
        <AppText variant="displayLarge">{title}</AppText>
        <AppText color="textMuted" style={styles.description}>{description}</AppText>
        <AppCard style={styles.card}>
          <AppText color="primary" variant="overline">TRIMLY</AppText>
          <AppText style={styles.cardText} variant="heading">
            Bu ekranı sıradaki adımlarda birlikte tasarlayacağız.
          </AppText>
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  description: { marginTop: spacing.sm },
  card: { backgroundColor: colors.surfaceMuted, marginTop: spacing.xxl },
  cardText: { marginTop: spacing.xs },
});
