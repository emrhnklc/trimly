import { StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import type { PublicBarbershopDetail } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type BarbershopInfoCardProps = {
  barbershop: PublicBarbershopDetail;
};

export function BarbershopInfoCard({ barbershop }: BarbershopInfoCardProps) {
  return (
    <AppCard style={styles.card}>
      <InfoRow
        icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
        label="Konum"
        value={barbershop.address || 'Adres bilgisi eklenmemiş.'}
      />
      <View style={styles.divider} />
      <InfoRow
        icon={{ ios: 'phone', android: 'call', web: 'call' }}
        label="Telefon"
        value={barbershop.phone || 'Telefon bilgisi eklenmemiş.'}
      />
    </AppCard>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.iconContainer}>
        <SymbolView name={icon} size={18} tintColor={colors.primary} />
      </View>
      <View style={styles.textContainer}>
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
        <AppText style={styles.value} variant="label">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', paddingVertical: spacing.xs },
  iconContainer: { alignItems: 'center', justifyContent: 'center', width: 36 },
  textContainer: { flex: 1, marginLeft: spacing.xs },
  value: { marginTop: 2 },
  divider: { backgroundColor: colors.border, height: 1, marginLeft: 44 },
});
