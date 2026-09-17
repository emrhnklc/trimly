import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import {
  getManagementService,
  updateManagementService,
} from '@/features/business-management/api';
import type { ManagementService } from '@/features/business-management/types';
import { BusinessServiceState } from '@/features/business-services/components/BusinessServiceState';
import {
  ServiceForm,
  type ServiceFormValues,
} from '@/features/business-services/components/ServiceForm';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditManagementServiceScreen() {
  const router = useRouter();
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [service, setService] = useState<ManagementService | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadService = useCallback(async () => {
    if (!activeMembership || !token || !serviceId) return;

    setLoading(true);
    setLoadError(null);
    try {
      setService(
        await getManagementService(activeMembership.barbershop.id, serviceId, token),
      );
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Hizmet yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, serviceId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadService();
    }, [loadService]),
  );

  if (!activeMembership) return null;

  async function handleSubmit(values: ServiceFormValues) {
    if (!activeMembership || !token || !serviceId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateManagementService(
        activeMembership.barbershop.id,
        serviceId,
        {
          description: values.description,
          durationMinutes: values.durationMinutes,
          isActive: values.isActive,
          name: values.name,
          price: values.price,
        },
        token,
      );
      router.dismissTo('/management/services');
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Hizmet güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <BusinessDetailHeader
            onBack={() => router.dismissTo('/management/services')}
            title="Hizmeti Düzenle"
          />
          {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {!isLoading && loadError ? (
            <BusinessServiceState
              actionLabel="Tekrar Dene"
              description={loadError}
              error
              onAction={() => void loadService()}
              title="Hizmet yüklenemedi"
            />
          ) : null}

          {!isLoading && !loadError && service ? (
            <ServiceForm
              error={submitError}
              initialValues={{
                description: service.description ?? '',
                durationMinutes: service.durationMinutes,
                isActive: service.isActive,
                name: service.name,
                price: service.price,
              }}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              showActiveStatus
              submitLabel="Değişiklikleri Kaydet"
            />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
});
