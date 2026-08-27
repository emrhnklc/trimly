import { StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/spacing';

type HomeHeaderProps = {
  onNotificationsPress?: () => void;
};

export function HomeHeader({ onNotificationsPress }: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View>
        <TrimlyLogo size="small" style={styles.logo} />
        <AppText color="textMuted" style={styles.tagline} variant="bodySmall">
          Tarzın. Randevun. Geçmişin.
        </AppText>
      </View>
      <AppIconButton
        accessibilityLabel="Bildirimleri aç"
        icon={{ ios: 'bell', android: 'notifications', web: 'notifications' }}
        onPress={onNotificationsPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  logo: { alignSelf: 'flex-start' },
  tagline: { marginTop: spacing.xxs },
});
