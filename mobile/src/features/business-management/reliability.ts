import type {
  AppointmentStatus,
  BusinessCancellationPointReason,
  BusinessReliabilityActionType,
} from '@/features/appointments/types';

export const cancellationPointReasonLabels: Record<
  BusinessCancellationPointReason,
  string
> = {
  MORE_THAN_24_HOURS: 'Randevuya 24 saatten fazla kala iptal edildi.',
  BETWEEN_6_AND_24_HOURS: 'Randevuya 6–24 saat kala iptal edildi.',
  BETWEEN_2_AND_6_HOURS: 'Randevuya 2–6 saat kala iptal edildi.',
  BETWEEN_2_AND_24_HOURS: 'Randevuya 2–24 saat kala iptal edildi.',
  LESS_THAN_2_HOURS: 'Randevuya 2 saatten az kala iptal edildi.',
  AFTER_START: 'Randevu başlangıç saatinden sonra iptal edildi.',
  CUSTOMER_ARRIVED: 'Müşteri geldi durumundayken iptal edildi.',
};

export const reliabilityActionLabels: Record<
  BusinessReliabilityActionType,
  string
> = {
  WARNING: 'Uyarı seviyesi açıldı; işletme programını kontrol et.',
  MEMBER_REVIEW_HOLD:
    'İlgili çalışanın yeni randevuları program doğrulanana kadar durduruldu.',
  DISCOVERY_DEMOTION:
    'İşletme 7 gün boyunca keşfet sıralamasında hafifçe geriye alındı.',
  BOOKING_SUSPENSION: 'Yeni randevu alımına geçici kısıtlama uygulandı.',
  MANUAL_REVIEW: 'İşletme hesabı platform incelemesine alındı.',
};

export const cancellationPointRules = [
  { label: '24 saatten fazla kala', points: 0 },
  { label: '6–24 saat kala', points: 1 },
  { label: '2–6 saat kala', points: 2 },
  { label: '2 saatten az kala', points: 3 },
  { label: 'Başlangıçtan sonra veya müşteri geldiyse', points: 3 },
] as const;

export const reliabilityThresholds = [
  { points: 3, label: 'Uyarı ve program kontrolü' },
  { points: 5, label: 'Çalışan kontrolü veya 7 gün hafif keşfet düşüşü' },
  { points: 8, label: '72 saat yeni randevu kısıtı' },
  { points: 16, label: '7 gün kısıt ve platform incelemesi' },
] as const;

export function estimateCancellationPoints(
  startsAt: string,
  status: AppointmentStatus,
  now = Date.now(),
) {
  if (status === 'ARRIVED') return 3;
  const leadMs = new Date(startsAt).getTime() - now;
  if (leadMs <= 0) return 3;
  if (leadMs > 24 * 60 * 60_000) return 0;
  if (leadMs >= 6 * 60 * 60_000) return 1;
  if (leadMs >= 2 * 60 * 60_000) return 2;
  return 3;
}

export function getNextReliabilityThreshold(points: number) {
  return reliabilityThresholds.find((threshold) => threshold.points > points) ?? null;
}
