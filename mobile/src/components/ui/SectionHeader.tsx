import { Pressable, StyleSheet, View } from 'react-native';

import { spacing } from '@/theme/spacing';
import { AppText } from './AppText';

type SectionHeaderProps = {
  actionLabel?: string;
  onActionPress?: () => void;
  title: string;
};

export function SectionHeader({ actionLabel, onActionPress, title }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <AppText style={styles.title} variant="heading">
        {title}
      </AppText>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityLabel={`${title}: ${actionLabel}`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={onActionPress}
          style={({ pressed }) => pressed && styles.pressed}>
          <AppText color="primary" variant="label">
            {actionLabel} ›
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xxl,
  },
  title: { flex: 1 },
  pressed: { opacity: 0.68 },
});
