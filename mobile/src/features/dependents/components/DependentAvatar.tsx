import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { radius } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function DependentAvatar({ firstName, lastName, size = 52 }: {
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const colors = useThemeColors();
  const initials = `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`.toLocaleUpperCase('tr-TR');
  return (
    <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted, height: size, width: size }]}>
      <AppText color="primary" style={{ fontSize: Math.max(14, size * 0.3) }} variant="label">
        {initials}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', borderRadius: radius.pill, justifyContent: 'center' },
});
