import { SymbolView } from 'expo-symbols';
import { Redirect, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import {
  getBusinessReliability,
  requestBusinessCancellationAppeal,
  resolveBusinessMemberHold,
  type BusinessReliabilityStatus,
} from '@/features/business-management/api';
import { BusinessCancellationAppealSheet } from '@/features/business-management/components/BusinessCancellationAppealSheet';
import {
  cancellationPointReasonLabels,
  cancellationPointRules,
  getNextReliabilityThreshold,
  reliabilityActionLabels,
  reliabilityThresholds,
} from '@/features/business-management/reliability';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';
import { useThemeColors } from '@/theme/useThemeColors';

export default function BusinessReliabilityScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [status, setStatus] = useState<BusinessReliabilityStatus | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isRefreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appealEventId, setAppealEventId] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);

  const canManageReliability =
    activeMembership?.role === 'OWNER' || activeMembership?.role === 'MANAGER';

  const load = useCallback(
    async (refreshing = false) => {
      if (!activeMembership || !token || !canManageReliability) return;
      if (refreshing) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        setStatus(
          await getBusinessReliability(activeMembership.barbershop.id, token),
        );
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Güvenilirlik bilgileri yüklenemedi.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeMembership, canManageReliability, token],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const nextThreshold = useMemo(
    () => getNextReliabilityThreshold(status?.points90Days ?? 0),
    [status?.points90Days],
  );
  const signalMessages = useMemo(() => {
    if (!status) return [];
    const messages: string[] = [];
    if (status.operationalSignals.maxMemberCancellationsToday >= 2) {
      messages.push(
        'Aynı çalışanda bugün birden fazla iptal var. Kalan vardiya ve uygunluk saatlerini kontrol et.',
      );
    } else if (status.operationalSignals.cancellationsToday >= 2) {
      messages.push(
        'Bugün birden fazla işletme iptali var. Yeni sorun oluşmadan çalışma programını kontrol et.',
      );
    }
    if (status.operationalSignals.consecutiveBusinessCancellations >= 3) {
      messages.push(
        'Sonuçlanan randevular arasında art arda üç işletme iptali görüldü.',
      );
    }
    if (status.operationalSignals.earlyCancellations7Days >= 3) {
      messages.push(
        'Son 7 günde üç veya daha fazla erken iptal var. Erken iptaller puansız olsa da tekrar sinyali olarak izlenir.',
      );
    }
    if (
      !status.metrics30Days.informationalOnly &&
      status.metrics30Days.cancellationRatePercent >= 15
    ) {
      messages.push(
        'Son 30 günlük işletme iptal oranı %15 seviyesinin üzerinde.',
      );
    }
    return messages;
  }, [status]);

  if (activeMembership && !canManageReliability) {
    return <Redirect href="/(business)/management" />;
  }
  if (!activeMembership) return null;

  async function submitAppeal(reason: string) {
    if (!appealEventId || !token || !activeMembership) return;
    setSubmitting(true);
    try {
      await requestBusinessCancellationAppeal(
        activeMembership.barbershop.id,
        appealEventId,
        reason,
        token,
      );
      setAppealEventId(null);
      await load();
    } catch (reason) {
      Alert.alert(
        'İtiraz gönderilemedi',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function confirmMemberProgram(actionId: string, memberName: string) {
    Alert.alert(
      'Program kontrolü tamamlansın mı?',
      `${memberName} için çalışma saatleri, izinler ve hizmet atamalarını kontrol ettiğini onaylıyorsun.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Kontrol Ettim',
          onPress: () => void resolveMemberProgram(actionId),
        },
      ],
    );
  }

  async function resolveMemberProgram(actionId: string) {
    if (!token || !activeMembership) return;
    setSubmitting(true);
    try {
      await resolveBusinessMemberHold(
        activeMembership.barbershop.id,
        actionId,
        token,
      );
      await load();
    } catch (reason) {
      Alert.alert(
        'Kontrol tamamlanamadı',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const timeZone = activeMembership.barbershop.timezone;

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader
          onBack={() =>
            router.canGoBack()
              ? router.back()
              : router.replace('/(business)/management')
          }
          title="İşletme Güvenilirliği"
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void load(true)}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {!isLoading && error ? (
          <AppCard style={styles.errorCard}>
            <AppText color="danger" variant="label">Bilgiler yüklenemedi</AppText>
            <AppText color="textMuted" variant="bodySmall">{error}</AppText>
            <AppButton onPress={() => void load()} variant="secondary">Tekrar Dene</AppButton>
          </AppCard>
        ) : null}

        {!isLoading && !error && status ? (
          <>
            <View
              style={[
                styles.hero,
                {
                  backgroundColor:
                    status.points90Days > 0 ? colors.dangerSurface : colors.surface,
                  borderColor:
                    status.points90Days > 0 ? colors.danger : colors.border,
                },
              ]}
            >
              <View style={styles.heroTop}>
                <View>
                  <AppText color="textMuted" variant="overline">SON 90 GÜN</AppText>
                  <AppText style={styles.heroTitle} variant="heading">
                    Aktif ceza puanı
                  </AppText>
                </View>
                <View
                  style={[
                    styles.scoreCircle,
                    { backgroundColor: colors.background },
                  ]}
                >
                  <AppText color={status.points90Days > 0 ? 'danger' : 'success'} style={styles.heroScore} variant="displayMedium">
                    {status.points90Days}
                  </AppText>
                </View>
              </View>
              <AppText color="textMuted" variant="bodySmall">
                {status.cancellationCount90Days} işletme iptali kaydedildi.
                {' '}
                {nextThreshold
                  ? `Sıradaki eşik ${nextThreshold.points} puan: ${nextThreshold.label}.`
                  : 'En yüksek eşik aşıldı; platform incelemesi gerekebilir.'}
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="sectionTitle">Davranış görünümü</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Günlük, seri ve oran kontrolleri aynı iptale ikinci bir puan yazmaz; yeni iptalleri önlemek için risk sinyali üretir.
              </AppText>
              <View style={styles.signalGrid}>
                <AppCard style={styles.signalCard}>
                  <AppText color="textMuted" variant="bodySmall">Bugün</AppText>
                  <AppText style={styles.signalValue} variant="heading">
                    {status.operationalSignals.cancellationsToday}
                  </AppText>
                  <AppText color="textMuted" variant="bodySmall">işletme iptali</AppText>
                </AppCard>
                <AppCard style={styles.signalCard}>
                  <AppText color="textMuted" variant="bodySmall">Üst üste</AppText>
                  <AppText style={styles.signalValue} variant="heading">
                    {status.operationalSignals.consecutiveBusinessCancellations}
                  </AppText>
                  <AppText color="textMuted" variant="bodySmall">işletme iptali</AppText>
                </AppCard>
                <AppCard style={styles.signalCard}>
                  <AppText color="textMuted" variant="bodySmall">Son 7 gün</AppText>
                  <AppText style={styles.signalValue} variant="heading">
                    {status.operationalSignals.earlyCancellations7Days}
                  </AppText>
                  <AppText color="textMuted" variant="bodySmall">erken iptal</AppText>
                </AppCard>
                <AppCard style={styles.signalCard}>
                  <AppText color="textMuted" variant="bodySmall">30 günlük oran</AppText>
                  <AppText style={styles.signalValue} variant="heading">
                    %{formatPercent(status.metrics30Days.cancellationRatePercent)}
                  </AppText>
                  <AppText color="textMuted" variant="bodySmall">
                    {status.metrics30Days.handledAppointmentCount} sonuçlanan kayıt
                  </AppText>
                </AppCard>
              </View>
              <View
                style={[
                  styles.signalNotice,
                  {
                    backgroundColor:
                      signalMessages.length > 0
                        ? colors.infoSurface
                        : colors.successSurface,
                  },
                ]}
              >
                <SymbolView
                  name={{
                    ios:
                      signalMessages.length > 0
                        ? 'waveform.path.ecg'
                        : 'checkmark.shield.fill',
                    android:
                      signalMessages.length > 0 ? 'monitor_heart' : 'verified_user',
                    web:
                      signalMessages.length > 0 ? 'monitor_heart' : 'verified_user',
                  }}
                  size={22}
                  tintColor={
                    signalMessages.length > 0 ? colors.info : colors.success
                  }
                />
                <View style={styles.flex}>
                  <AppText
                    color={signalMessages.length > 0 ? 'info' : 'success'}
                    variant="label"
                  >
                    {signalMessages.length > 0
                      ? 'Kontrol edilmesi gereken sinyal var'
                      : 'Tekrarlayan risk sinyali yok'}
                  </AppText>
                  {signalMessages.map((message) => (
                    <AppText color="textMuted" key={message} variant="bodySmall">
                      • {message}
                    </AppText>
                  ))}
                  {status.metrics30Days.informationalOnly ? (
                    <AppText color="textMuted" variant="bodySmall">
                      30 günlük oran, 10 sonuçlanan kayda ulaşana kadar yalnız bilgi amaçlıdır.
                    </AppText>
                  ) : null}
                </View>
              </View>
            </View>

            {status.actions.length > 0 ? (
              <View style={styles.section}>
                <AppText variant="sectionTitle">Aktif sonuçlar</AppText>
                {status.actions.map((action) => {
                  const memberName = action.businessMember
                    ? `${action.businessMember.user.firstName} ${action.businessMember.user.lastName}`
                    : null;
                  return (
                    <AppCard key={action.id} style={styles.actionCard}>
                      <View style={styles.actionHeading}>
                        <SymbolView
                          name={{
                            ios: 'exclamationmark.shield.fill',
                            android: 'gpp_maybe',
                            web: 'gpp_maybe',
                          }}
                          size={21}
                          tintColor={colors.danger}
                        />
                        <AppText color="danger" style={styles.flex} variant="label">
                          {reliabilityActionLabels[action.type]}
                        </AppText>
                      </View>
                      {action.endsAt ? (
                        <AppText color="textMuted" variant="bodySmall">
                          Bitiş: {formatDateTime(action.endsAt, timeZone)}
                        </AppText>
                      ) : null}
                      {action.type === 'MEMBER_REVIEW_HOLD' &&
                      activeMembership.role === 'OWNER' ? (
                        <AppButton
                          disabled={isSubmitting}
                          onPress={() =>
                            confirmMemberProgram(
                              action.id,
                              memberName ?? 'Çalışan',
                            )
                          }
                          variant="secondary"
                        >
                          Çalışan Programını Kontrol Ettim
                        </AppButton>
                      ) : null}
                    </AppCard>
                  );
                })}
              </View>
            ) : null}

            <View style={styles.section}>
              <AppText variant="sectionTitle">İptal puanı nasıl hesaplanır?</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Her iptal yalnız bir zaman puanı üretir. Puanlar hareketli son 90 gün üzerinden hesaplanır; haklı bulunan itiraz toplamdan çıkarılır.
              </AppText>
              <AppCard style={styles.rulesCard}>
                {cancellationPointRules.map((rule, index) => (
                  <View
                    key={rule.label}
                    style={[
                      styles.ruleRow,
                      index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
                    ]}
                  >
                    <AppText style={styles.flex} variant="bodySmall">{rule.label}</AppText>
                    <AppText color={rule.points > 0 ? 'danger' : 'success'} variant="label">
                      +{rule.points} puan
                    </AppText>
                  </View>
                ))}
              </AppCard>
            </View>

            <View style={styles.section}>
              <AppText variant="sectionTitle">Puanlara göre yaptırımlar</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Sorun tek çalışanda yoğunlaşıyorsa önce o çalışanın programı kontrol edilir; bütün işletme gereksiz yere kapatılmaz.
              </AppText>
              <AppCard style={styles.rulesCard}>
                {reliabilityThresholds.map((threshold, index) => (
                  <View
                    key={threshold.points}
                    style={[
                      styles.ruleRow,
                      index > 0 && { borderTopColor: colors.border, borderTopWidth: 1 },
                    ]}
                  >
                    <AppText color="primary" style={styles.thresholdLabel} variant="label">
                      {threshold.points} puan
                    </AppText>
                    <AppText color="textMuted" style={styles.flex} variant="bodySmall">
                      {threshold.label}
                    </AppText>
                  </View>
                ))}
              </AppCard>
            </View>

            <View style={styles.section}>
              <AppText variant="sectionTitle">İptal geçmişi</AppText>
              {status.recentCancellations.length === 0 ? (
                <AppCard style={styles.emptyCard}>
                  <SymbolView
                    name={{ ios: 'checkmark.shield.fill', android: 'verified_user', web: 'verified_user' }}
                    size={28}
                    tintColor={colors.success}
                  />
                  <AppText variant="label">Son 90 günde işletme iptali yok</AppText>
                </AppCard>
              ) : (
                status.recentCancellations.map((event) => {
                  const removed = event.appealStatus === 'APPROVED';
                  return (
                    <AppCard key={event.id} style={styles.eventCard}>
                      <View style={styles.eventTop}>
                        <View style={styles.flex}>
                          <AppText variant="label">
                            {event.appointment.attendeeNameSnapshot}
                          </AppText>
                          <AppText color="textMuted" variant="bodySmall">
                            {event.appointment.serviceNameSnapshot} · {formatDateTime(event.appointment.startsAt, timeZone)}
                          </AppText>
                        </View>
                        <View
                          style={[
                            styles.pointsBadge,
                            { backgroundColor: removed ? colors.successSurface : colors.dangerSurface },
                          ]}
                        >
                          <AppText color={removed ? 'success' : 'danger'} variant="label">
                            {removed ? 'Kaldırıldı' : `+${event.points} puan`}
                          </AppText>
                        </View>
                      </View>
                      <View style={[styles.eventReason, { backgroundColor: colors.surfaceMuted }]}>
                        <AppText variant="bodySmall">
                          {cancellationPointReasonLabels[event.pointReason]}
                        </AppText>
                        <AppText color="textMuted" variant="bodySmall">
                          İşletme açıklaması: {event.reason}
                        </AppText>
                      </View>
                      <AppText color="textMuted" variant="bodySmall">
                        İşlemi yapan çalışan: {event.businessMember.user.firstName} {event.businessMember.user.lastName}
                      </AppText>
                      {event.appealStatus === 'PENDING' ? (
                        <AppText color="primary" variant="bodySmall">İtiraz incelemede</AppText>
                      ) : null}
                      {event.appealStatus === 'REJECTED' ? (
                        <AppText color="danger" variant="bodySmall">İtiraz reddedildi</AppText>
                      ) : null}
                      {event.appealReviewNote ? (
                        <AppText color="textMuted" variant="bodySmall">
                          İnceleme notu: {event.appealReviewNote}
                        </AppText>
                      ) : null}
                      {event.points > 0 && event.appealStatus === 'NOT_REQUESTED' ? (
                        <AppButton
                          disabled={isSubmitting}
                          onPress={() => setAppealEventId(event.id)}
                        >
                          İtiraz Et
                        </AppButton>
                      ) : null}
                    </AppCard>
                  );
                })
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      {appealEventId ? (
        <BusinessCancellationAppealSheet
          isSubmitting={isSubmitting}
          onClose={() => setAppealEventId(null)}
          onSubmit={(reason) => void submitAppeal(reason)}
          visible
        />
      ) : null}
    </Screen>
  );
}

function formatDateTime(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value));
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: 1,
  }).format(value);
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  content: { paddingBottom: 120, paddingHorizontal: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  errorCard: { gap: spacing.sm, marginTop: spacing.lg },
  hero: {
    borderRadius: radius.card,
    borderWidth: 1,
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.lg,
  },
  heroTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  heroTitle: { marginTop: spacing.xxs },
  scoreCircle: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  heroScore: { fontFamily: fontFamily.bodyBold, fontSize: 36, lineHeight: 42 },
  section: { gap: spacing.sm, marginTop: spacing.xl },
  actionCard: { gap: spacing.sm },
  actionHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  signalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  signalCard: {
    flexBasis: '47%',
    flexGrow: 1,
    gap: spacing.xxs,
    minHeight: 112,
  },
  signalValue: { marginTop: spacing.xxs },
  signalNotice: {
    alignItems: 'flex-start',
    borderRadius: radius.smallCard,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  rulesCard: { paddingVertical: 0 },
  ruleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 52, paddingVertical: spacing.sm },
  thresholdLabel: { minWidth: 54 },
  eventCard: { gap: spacing.sm },
  eventTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm },
  pointsBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  eventReason: { borderRadius: radius.smallCard, gap: spacing.xs, padding: spacing.sm },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  flex: { flex: 1 },
});
