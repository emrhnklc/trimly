import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { createAppointment } from '@/features/appointments/api';
import { BookingFlowHeader } from '@/features/appointments/components/BookingFlowHeader';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

type PreviewParams = {
  barberName?: string;
  barbershopId?: string;
  date?: string;
  durationMinutes?: string;
  campaignId?: string;
  campaignBenefit?: string;
  campaignTitle?: string;
  memberId?: string;
  price?: string;
  originalPrice?: string;
  serviceId?: string;
  serviceName?: string;
  shopName?: string;
  startsAt?: string;
  time?: string;
  attendeeName?: string;
  dependentProfileId?: string;
};

export default function AppointmentPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<PreviewParams>();
  const { token } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = Boolean(
    token && params.barbershopId && params.memberId && params.serviceId && params.startsAt,
  );

  async function confirmAppointment() {
    if (!token || !params.barbershopId || !params.memberId || !params.serviceId || !params.startsAt) {
      setError('Randevu bilgileri eksik. Lütfen saatini yeniden seç.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createAppointment(
        params.barbershopId,
        {
          memberId: params.memberId,
          serviceId: params.serviceId,
          startsAt: params.startsAt,
          ...(params.campaignId ? { campaignId: params.campaignId } : {}),
          ...(params.dependentProfileId
            ? { dependentProfileId: params.dependentProfileId }
            : {}),
        },
        token,
      );
      router.replace('/appointments');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu oluşturulamadı.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Screen>
      <BookingFlowHeader
        activeStep={6}
        onBack={() => router.back()}
        onClose={() => router.back()}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconCircle}>
            <SymbolView
              name={{ ios: 'calendar.badge.checkmark', android: 'event_available', web: 'event_available' }}
              size={30}
              tintColor={colors.primary}
            />
          </View>
          <AppText style={styles.title} variant="displayMedium">Randevunu kontrol et</AppText>
          <AppText color="textMuted" style={styles.description}>
            Onaylamadan önce işletme, hizmet ve saat bilgilerini kontrol et.
          </AppText>
        </View>

        <AppCard style={styles.card}>
          <DetailRow
            icon={{ ios: 'person.2', android: 'group', web: 'group' }}
            label="Randevu sahibi"
            value={params.attendeeName || '—'}
          />
          <DetailRow
            icon={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            label="İşletme"
            value={params.shopName || '—'}
          />
          <DetailRow
            icon={{ ios: 'person', android: 'person', web: 'person' }}
            label="Berber"
            value={params.barberName || '—'}
          />
          <DetailRow
            icon={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
            label="Hizmet"
            value={params.serviceName || '—'}
          />
          <DetailRow
            icon={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }}
            label="Tarih"
            value={formatDate(params.date)}
          />
          <DetailRow
            icon={{ ios: 'clock', android: 'schedule', web: 'schedule' }}
            label="Saat"
            value={params.time || '—'}
          />
          <DetailRow
            icon={{ ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' }}
            label="Süre"
            value={params.durationMinutes ? `${params.durationMinutes} dk` : '—'}
          />
          {params.campaignTitle ? (
            <DetailRow
              icon={{ ios: 'tag.fill', android: 'local_offer', web: 'local_offer' }}
              label="Kampanya"
              value={`${params.campaignTitle}${params.campaignBenefit ? ` · ${params.campaignBenefit}` : ''}`}
            />
          ) : null}
          {params.originalPrice ? (
            <DetailRow
              icon={{ ios: 'arrow.down.circle', android: 'trending_down', web: 'trending_down' }}
              label="Normal fiyat"
              value={`₺${formatPrice(params.originalPrice)}`}
            />
          ) : null}
          <DetailRow
            icon={{ ios: 'turkishlirasign.circle', android: 'payments', web: 'payments' }}
            isLast
            label="Fiyat"
            value={params.price ? `₺${formatPrice(params.price)}` : '—'}
          />
        </AppCard>

        {error ? (
          <View style={styles.errorBox}>
            <SymbolView
              name={{ ios: 'exclamationmark.circle', android: 'error_outline', web: 'error_outline' }}
              size={18}
              tintColor={colors.danger}
            />
            <AppText color="danger" style={styles.errorText} variant="bodySmall">{error}</AppText>
          </View>
        ) : null}

        <View style={styles.button}>
          <AppButton disabled={!canSubmit || isSubmitting} onPress={() => void confirmAppointment()}>
            {isSubmitting ? 'Randevu oluşturuluyor…' : 'Randevuyu Onayla'}
          </AppButton>
        </View>

        <View style={styles.securityNote}>
          <SymbolView
            name={{ ios: 'shield.checkered', android: 'verified_user', web: 'verified_user' }}
            size={15}
            tintColor={colors.textMuted}
          />
          <AppText color="textMuted" variant="bodySmall">
            Saat, onay anında tekrar kontrol edilir.
          </AppText>
        </View>
      </ScrollView>
    </Screen>
  );
}

function DetailRow({
  icon,
  isLast = false,
  label,
  value,
}: {
  icon: SymbolViewProps['name'];
  isLast?: boolean;
  label: string;
  value: string;
}) {
  return (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <View style={styles.rowLabel}>
        <SymbolView name={icon} size={17} tintColor={colors.primary} />
        <AppText color="textMuted" variant="bodySmall">{label}</AppText>
      </View>
      <AppText numberOfLines={2} style={styles.rowValue} variant="label">{value}</AppText>
    </View>
  );
}

function formatDate(date?: string) {
  if (!date) return '—';

  const parsedDate = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    weekday: 'short',
  }).format(parsedDate);
}

function formatPrice(price: string) {
  const numericPrice = Number(price);
  return Number.isFinite(numericPrice)
    ? new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(numericPrice)
    : price;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  intro: { alignItems: 'center', marginTop: spacing.lg },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  title: { fontFamily: fontFamily.display, marginTop: spacing.sm, textAlign: 'center' },
  description: { marginTop: spacing.xs, maxWidth: 320, textAlign: 'center' },
  card: { marginTop: spacing.xl, paddingVertical: spacing.xs },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingVertical: spacing.xs,
  },
  rowDivider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowLabel: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  rowValue: { flex: 1, marginLeft: spacing.md, textAlign: 'right' },
  errorBox: {
    alignItems: 'center',
    backgroundColor: '#F8E8E5',
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  errorText: { flex: 1, marginLeft: spacing.xs },
  button: { marginTop: spacing.xl },
  securityNote: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
});
