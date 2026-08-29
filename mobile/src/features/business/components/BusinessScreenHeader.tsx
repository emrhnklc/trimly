import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

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
      <View style={styles.row}>
        <View style={styles.side} />
        <AppText style={styles.title} variant="heading">{title}</AppText>
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
      {subtitle ? (
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 48 },
  side: { alignItems: 'flex-end', width: 44 },
  title: { flex: 1, fontSize: 18, lineHeight: 24, textAlign: 'center' },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  subtitle: { marginTop: spacing.xs, textAlign: 'center' },
});
