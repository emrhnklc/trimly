import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BusinessScreenHeaderProps = {
  showNotification?: boolean;
  subtitle?: string;
  title: string;
};

export function BusinessScreenHeader({
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
            <View style={styles.iconShell}>
              <SymbolView
                name={{ ios: 'bell', android: 'notifications_none', web: 'notifications_none' }}
                size={19}
                tintColor={colors.text}
              />
            </View>
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
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
});
