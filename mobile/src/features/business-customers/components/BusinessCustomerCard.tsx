import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessCustomer } from '@/features/business-customers/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatCustomerAppointment, formatCustomerDate } from '../date';

export function BusinessCustomerCard({
  customer,
  timeZone,
}: {
  customer: BusinessCustomer;
  timeZone: string;
}) {
  const fullName = `${customer.firstName} ${customer.lastName}`;
  const initials = `${customer.firstName[0] ?? ''}${customer.lastName[0] ?? ''}`;
  const isRegular = customer.completedVisitCount >= 3;

  return (
    <View style={styles.card}>
      {customer.profileImageUrl ? (
        <Image
          accessibilityLabel={`${fullName} profil fotoğrafı`}
          contentFit="cover"
          source={customer.profileImageUrl}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText color="primary" variant="label">{initials}</AppText>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <AppText numberOfLines={1} style={styles.name} variant="label">{fullName}</AppText>
          {isRegular ? (
            <View style={styles.regularBadge}>
              <AppText color="primary" style={styles.regularLabel} variant="label">Düzenli</AppText>
            </View>
          ) : null}
        </View>
        <AppText color="textMuted" numberOfLines={1} style={styles.lastVisit} variant="bodySmall">
          {customer.lastVisitAt
            ? `Son ziyaret: ${formatCustomerDate(customer.lastVisitAt, timeZone)}`
            : 'Henüz tamamlanan ziyareti yok'}
        </AppText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={13}
              tintColor={colors.textMuted}
            />
            <AppText color="textMuted" style={styles.metaLabel} variant="bodySmall">
              {customer.completedVisitCount} ziyaret
            </AppText>
          </View>
          {customer.nextAppointmentAt ? (
            <View style={styles.metaItem}>
              <SymbolView
                name={{ ios: 'calendar', android: 'event', web: 'event' }}
                size={13}
                tintColor={colors.primary}
              />
              <AppText color="primary" style={styles.metaLabel} variant="bodySmall">
                {formatCustomerAppointment(customer.nextAppointmentAt, timeZone)}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 88,
    paddingVertical: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 50, width: 50 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  content: { flex: 1, marginLeft: spacing.sm },
  nameRow: { alignItems: 'center', flexDirection: 'row' },
  name: { flex: 1 },
  regularBadge: {
    backgroundColor: '#F4E7C8',
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  regularLabel: { fontSize: 9, lineHeight: 12 },
  lastVisit: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: 6 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaLabel: { fontSize: 9, lineHeight: 13 },
});
