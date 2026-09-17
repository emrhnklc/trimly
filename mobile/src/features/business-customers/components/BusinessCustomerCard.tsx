import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessCustomer } from '@/features/business-customers/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { formatCustomerAppointment, formatCustomerDate } from '../date';

export function BusinessCustomerCard({
  customer,
  onPress,
  timeZone,
}: {
  customer: BusinessCustomer;
  onPress?: () => void;
  timeZone: string;
}) {
  const themeColors = useThemeColors();
  if (!customer) return null;

  const fullName = `${customer.firstName} ${customer.lastName}`;
  const initials = `${customer.firstName[0] ?? ''}${customer.lastName[0] ?? ''}`;
  const isRegular = customer.completedVisitCount >= 3;

  return (
    <Pressable
      accessibilityLabel={`${fullName} müşteri detayını aç`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { borderBottomColor: themeColors.border },
        pressed && styles.pressed,
      ]}
    >
      {customer.profileImageUrl ? (
        <Image
          accessibilityLabel={`${fullName} profil fotoğrafı`}
          contentFit="cover"
          source={customer.profileImageUrl}
          style={styles.avatar}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: themeColors.surfaceMuted },
          ]}>
          <AppText color="primary" variant="label">{initials}</AppText>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <AppText numberOfLines={1} style={styles.name} variant="label">{fullName}</AppText>
          {isRegular ? (
            <View style={[styles.regularBadge, { backgroundColor: themeColors.surfaceMuted }]}>
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
              tintColor={themeColors.textMuted}
            />
            <AppText color="textMuted" style={styles.metaLabel} variant="bodySmall">
              {customer.completedVisitCount} ziyaret
            </AppText>
          </View>
          {customer.nextAppointmentAt ? (
            <View style={[styles.metaItem, styles.nextAppointment]}>
              <SymbolView
                name={{ ios: 'calendar', android: 'event', web: 'event' }}
                size={13}
                tintColor={themeColors.primary}
              />
              <AppText color="primary" numberOfLines={1} style={styles.metaLabel} variant="bodySmall">
                {formatCustomerAppointment(customer.nextAppointmentAt, timeZone)}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>
      {onPress ? (
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={15}
          tintColor={themeColors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 82,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.65 },
  avatar: { borderRadius: radius.pill, height: 46, width: 46 },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, marginLeft: spacing.sm, minWidth: 0 },
  nameRow: { alignItems: 'center', flexDirection: 'row' },
  name: { flex: 1, fontSize: 15, lineHeight: 20, minWidth: 0 },
  regularBadge: {
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  regularLabel: { fontSize: 9, lineHeight: 12 },
  lastVisit: { fontSize: 11, lineHeight: 15, marginTop: 3 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, marginTop: 5 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4, maxWidth: '48%' },
  nextAppointment: { flex: 1 },
  metaLabel: { fontSize: 9, lineHeight: 13 },
});
