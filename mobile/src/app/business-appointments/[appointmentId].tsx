import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import {
  cancelBusinessAppointment,
  getBusinessAppointment,
  markBusinessAppointmentNoShow,
} from '@/features/appointments/api';
import type { BusinessAppointmentDetail } from '@/features/appointments/types';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessAppointmentDetailContent } from '@/features/business-appointments/components/BusinessAppointmentDetailContent';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { requestPortfolioPublication } from '@/features/portfolio/api';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessAppointmentDetailScreen() {
  const router = useRouter();
  const { appointmentId } = useLocalSearchParams<{ appointmentId?: string }>();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [appointment, setAppointment] = useState<BusinessAppointmentDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isUpdating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!appointmentId || !activeMembership || !token) {
      setError('Randevu bağlantısı geçersiz.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setAppointment(
        await getBusinessAppointment(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Randevu bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, appointmentId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment]),
  );

  async function runAction(action: 'cancel' | 'no-show') {
    if (!appointmentId || !activeMembership || !token) return;

    setUpdating(true);
    setError(null);
    try {
      if (action === 'cancel') {
        await cancelBusinessAppointment(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        );
      } else {
        await markBusinessAppointmentNoShow(
          activeMembership.barbershop.id,
          appointmentId,
          token,
        );
      }
      await loadAppointment();
    } catch (reason) {
      Alert.alert(
        'İşlem yapılamadı',
        reason instanceof Error ? reason.message : 'Lütfen tekrar dene.',
      );
    } finally {
      setUpdating(false);
    }
  }

  async function requestPortfolio(photoId: string) {
    if (!appointmentId || !activeMembership || !token || isUpdating) return;
    setUpdating(true);
    try {
      await requestPortfolioPublication(
        activeMembership.barbershop.id,
        appointmentId,
        photoId,
        token,
      );
      await loadAppointment();
      Alert.alert('Talep gönderildi', 'Fotoğraf, müşteri onayladığında portföyde yayınlanacak.');
    } catch (reason) {
      Alert.alert('Talep gönderilemedi', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    } finally {
      setUpdating(false);
    }
  }

  function confirmCancellation() {
    Alert.alert(
      'Randevu iptal edilsin mi?',
      'Bu işlem müşterinin randevusunu iptal edecek.',
      [
        { style: 'cancel', text: 'Vazgeç' },
        { style: 'destructive', text: 'İptal Et', onPress: () => void runAction('cancel') },
      ],
    );
  }

  function confirmNoShow() {
    Alert.alert(
      'Müşteri gelmedi mi?',
      'Randevu gelmedi olarak kaydedilecek.',
      [
        { style: 'cancel', text: 'Vazgeç' },
        { style: 'destructive', text: 'Gelmedi', onPress: () => void runAction('no-show') },
      ],
    );
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/calendar');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={goBack} title="Randevu Detayı" />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadAppointment()}
            title="Randevu yüklenemedi"
          />
        </View>
      ) : null}

      {!isLoading && !error && appointment ? (
        <BusinessAppointmentDetailContent
          accessToken={token ?? ''}
          appointment={appointment}
          canOpenCustomer={can('VIEW_CUSTOMERS')}
          isUpdating={isUpdating}
          onCancel={confirmCancellation}
          onNoShow={confirmNoShow}
          onOpenCustomer={() =>
            router.push({
              pathname: '/business-customers/[customerId]',
              params: { customerId: appointment.customer.id },
            })
          }
          onOpenHaircutRecord={() =>
            router.push({
              pathname: '/business-haircut-record/[appointmentId]',
              params: { appointmentId: appointment.id },
            })
          }
          onRequestPortfolio={(photoId) => void requestPortfolio(photoId)}
          onReschedule={() =>
            router.push({
              pathname: '/business-appointment-reschedule/[appointmentId]',
              params: { appointmentId: appointment.id },
            })
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md },
  loader: { marginTop: spacing.xxxl },
  state: { paddingHorizontal: spacing.lg },
});
