import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BookingSettings } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatMinutes } from '../format';

export function BookingSettingsSummaryCard({ settings }: { settings: BookingSettings }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}>
        <SymbolView
          name={{ ios: 'calendar.badge.clock', android: 'event_note', web: 'event_note' }}
          size={23}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <AppText color="onPrimary" style={styles.title} variant="label">
          Randevu düzeni
        </AppText>
        <AppText style={styles.description} variant="bodySmall">
          {settings.maxBookingAdvanceDays} gün ileri · {settings.slotIntervalMinutes} dk aralık
        </AppText>
        <AppText style={styles.description} variant="bodySmall">
          En erken {formatMinutes(settings.minBookingNoticeMinutes)}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: '#F7E9C5',
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  copy: { flex: 1, marginLeft: spacing.sm },
  title: { fontSize: 16, lineHeight: 22 },
  description: { color: '#DED2C7', marginTop: 2 },
});
