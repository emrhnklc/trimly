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
      <InfoCell
        icon={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
        label="Konum"
        value={barbershop.address || 'Adres eklenmemiş'}
      />
      <View style={styles.divider} />
      <InfoCell
        icon={{ ios: 'phone', android: 'call', web: 'call' }}
        label="İletişim"
        value={barbershop.phone || 'Telefon eklenmemiş'}
      />
    </AppCard>
  );
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.cell}>
      <SymbolView name={icon} size={18} tintColor={colors.primary} />
      <View style={styles.text}>
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
        <AppText numberOfLines={2} style={styles.value} variant="label">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', flexDirection: 'row', minHeight: 76, paddingVertical: spacing.sm },
  cell: { alignItems: 'center', flex: 1, flexDirection: 'row' },
  text: { flex: 1, marginLeft: spacing.xs },
  value: { marginTop: 2 },
  divider: { backgroundColor: colors.border, height: 42, marginHorizontal: spacing.sm, width: 1 },
});
