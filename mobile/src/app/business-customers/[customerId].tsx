import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { BusinessAppointmentState } from '@/features/business-appointments/components/BusinessAppointmentState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { getBusinessCustomer } from '@/features/business-customers/api';
import { BusinessCustomerDetailContent } from '@/features/business-customers/components/BusinessCustomerDetailContent';
import type { BusinessCustomerDetail } from '@/features/business-customers/types';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function BusinessCustomerDetailScreen() {
  const router = useRouter();
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [customer, setCustomer] = useState<BusinessCustomerDetail | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCustomer = useCallback(async () => {
    if (!customerId || !activeMembership || !token) {
      setError('Müşteri bağlantısı geçersiz.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      setCustomer(
        await getBusinessCustomer(
          activeMembership.barbershop.id,
          customerId,
          token,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Müşteri bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, customerId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadCustomer();
    }, [loadCustomer]),
  );

  return (
    <Screen>
      <View style={styles.header}>
        <BusinessDetailHeader onBack={() => router.back()} title="Müşteri Detayı" />
      </View>

      {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <BusinessAppointmentState
            description={error}
            error
            onRetry={() => void loadCustomer()}
            title="Müşteri yüklenemedi"
          />
        </View>
      ) : null}

      {!isLoading && !error && customer && activeMembership ? (
        <BusinessCustomerDetailContent
          customer={customer}
          onOpenAppointment={(appointmentId) =>
            router.push({
              pathname: '/business-appointments/[appointmentId]',
              params: { appointmentId },
            })
          }
          timeZone={activeMembership.barbershop.timezone}
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
