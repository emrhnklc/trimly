import { StyleSheet, Switch, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { BookingNumberSettingCard } from './BookingNumberSettingCard';
import { formatMinutes } from '../format';

export function CustomerCancellationCard({
  enabled,
  noticeMinutes,
  onChangeEnabled,
  onChangeNotice,
}: {
  enabled: boolean;
  noticeMinutes: number;
  onChangeEnabled: (value: boolean) => void;
  onChangeNotice: (value: number) => void;
}) {
  return (
    <View>
      <View style={styles.toggleCard}>
        <View style={styles.copy}>
          <AppText variant="label">Müşteri iptal edebilsin</AppText>
          <AppText color="textMuted" style={styles.description} variant="bodySmall">
            Kapalıysa randevuyu yalnızca işletme yönetebilir.
          </AppText>
        </View>
        <Switch
          accessibilityLabel="Müşteri iptal izni"
          ios_backgroundColor={colors.border}
          onValueChange={onChangeEnabled}
          thumbColor={colors.onPrimary}
          trackColor={{ false: colors.border, true: colors.primary }}
          value={enabled}
        />
      </View>

      {enabled ? (
        <BookingNumberSettingCard
          description="Bu süre kaldığında müşterinin iptal butonu kapanır."
          formatValue={formatMinutes}
          label="İptal için gereken süre"
          max={1440}
          min={0}
          onChange={onChangeNotice}
          step={30}
          value={noticeMinutes}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toggleCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 92,
    padding: spacing.md,
  },
  copy: { flex: 1, paddingRight: spacing.md },
  description: { marginTop: 2 },
});
