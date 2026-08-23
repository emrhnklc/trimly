import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/spacing';

export function HomeIntro() {
  return (
    <View>
      <AppText style={styles.title} variant="displayLarge">
        Tarzına uygun berberi keşfet.
      </AppText>
      <AppText color="textMuted" style={styles.subtitle}>
        Hizmeti, berberi ve sana uygun saati tek yerden seç.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xl, maxWidth: 330 },
  subtitle: { marginTop: spacing.sm },
});
