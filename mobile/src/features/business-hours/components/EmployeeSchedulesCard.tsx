import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

function ScheduleShortcut({
  description,
  icon,
  onPress,
  title,
}: {
  description: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  title: string;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconShell, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={icon} size={22} tintColor={colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText style={styles.title} variant="label">{title}</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          {description}
        </AppText>
      </View>
      <View style={styles.chevron}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={16}
          tintColor={colors.textMuted}
        />
      </View>
    </Pressable>
  );
}

export function EmployeeSchedulesCard({
  onPress,
  onTimeOffPress,
}: {
  onPress: () => void;
  onTimeOffPress: () => void;
}) {
  return (
    <View style={styles.row}>
      <ScheduleShortcut
        description="Haftalık çalışma planları"
        icon={{ ios: 'person.2', android: 'groups', web: 'groups' }}
        onPress={onPress}
        title="Çalışan vardiyaları"
      />
      <ScheduleShortcut
        description="Mola, izin ve tatil günleri"
        icon={{ ios: 'calendar.badge.minus', android: 'event_busy', web: 'event_busy' }}
        onPress={onTimeOffPress}
        title="İzinler"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  card: {
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    flex: 1,
    minHeight: 166,
    padding: spacing.md,
    position: 'relative',
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  copy: { flex: 1, marginTop: spacing.sm, minWidth: 0, paddingRight: spacing.sm },
  title: { fontSize: 14, lineHeight: 19 },
  description: { marginTop: spacing.xxs },
  chevron: { position: 'absolute', right: spacing.md, top: spacing.md },
  pressed: { opacity: 0.68 },
});
