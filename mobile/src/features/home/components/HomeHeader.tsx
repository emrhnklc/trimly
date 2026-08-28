import { StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { spacing } from '@/theme/spacing';

type HomeHeaderProps = {
  onNotificationsPress?: () => void;
};

export function HomeHeader({ onNotificationsPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
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
  rightAction: { position: 'absolute', right: 0 },
});
