import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { createManagementService } from '@/features/business-management/api';
import {
  ServiceForm,
  type ServiceFormValues,
} from '@/features/business-services/components/ServiceForm';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { layout } from '@/theme/spacing';

export default function NewManagementServiceScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeMembership) return null;

  async function handleSubmit(values: ServiceFormValues) {
    if (!activeMembership || !token) return;

    setSubmitting(true);
    setError(null);

    try {
      await createManagementService(
        activeMembership.barbershop.id,
        {
          description: values.description || undefined,
          durationMinutes: values.durationMinutes,
          name: values.name,
          price: values.price,
        },
        token,
      );
      router.dismissTo('/management/services');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Hizmet oluşturulamadı.');
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
            onBack={() => goBackOrReplace(router, '/(business)/management/services')}
            title="Yeni Hizmet"
          />
          <ServiceForm
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
            submitLabel="Hizmeti Oluştur"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
});
