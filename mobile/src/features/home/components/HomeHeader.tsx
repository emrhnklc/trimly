import { StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { spacing } from '@/theme/spacing';

type HomeHeaderProps = {
  onMenuPress?: () => void;
  onNotificationsPress?: () => void;
};

export function HomeHeader({ onMenuPress, onNotificationsPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.leftAction}>
        <AppIconButton
          accessibilityLabel="Menüyü aç"
          icon={{ ios: 'line.3.horizontal', android: 'menu', web: 'menu' }}
          onPress={onMenuPress}
          variant="transparent"
        />
      </View>
      <TrimlyLogo size="small" />
      <View style={styles.rightAction}>
        <AppIconButton
          accessibilityLabel="Bildirimleri aç"
          icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
          onPress={onNotificationsPress}
          variant="transparent"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    minHeight: 48,
    position: 'relative',
  },
  leftAction: { left: 0, position: 'absolute' },
  rightAction: { position: 'absolute', right: 0 },
});
