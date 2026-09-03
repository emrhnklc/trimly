import { StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppIconButton } from '@/components/ui/AppIconButton';
import { AppText } from '@/components/ui/AppText';
import { spacing } from '@/theme/spacing';

type BusinessScreenHeaderProps = {
  onNotificationPress?: () => void;
  showNotification?: boolean;
  subtitle?: string;
  title: string;
};

export function BusinessScreenHeader({
  onNotificationPress,
  showNotification = false,
  subtitle,
  title,
}: BusinessScreenHeaderProps) {
  return (
    <View>
      <View style={styles.logoRow}>
        <View style={styles.side} />
        <TrimlyLogo size="small" />
        <View style={styles.side}>
          {showNotification ? (
            <AppIconButton
              accessibilityLabel="Bildirimleri aç"
              icon={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
              onPress={onNotificationPress}
              size={19}
              variant="transparent"
            />
          ) : null}
        </View>
      </View>
      <AppText style={styles.title} variant="heading">{title}</AppText>
      {subtitle ? (
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  side: { alignItems: 'flex-end', width: 44 },
  title: { fontSize: 18, lineHeight: 24, marginTop: spacing.xxs, textAlign: 'center' },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
});
