import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { getManagementServices } from '@/features/business-management/api';
import type { ManagementService } from '@/features/business-management/types';
import {
  BusinessMemberForm,
  type BusinessMemberFormValues,
} from '@/features/business-members/components/BusinessMemberForm';
import { BusinessMemberState } from '@/features/business-members/components/BusinessMemberState';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import {
  assignBusinessMemberService,
  getBusinessMember,
  unassignBusinessMemberService,
  updateBusinessMember,
  updateBusinessMemberBookable,
} from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function EditBusinessMemberScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadMember = useCallback(async () => {
    if (!activeMembership || !token || !memberId) return;

    setLoading(true);
    setLoadError(null);
    try {
      const [nextMember, nextServices] = await Promise.all([
        getBusinessMember(activeMembership.barbershop.id, memberId, token),
        getManagementServices(activeMembership.barbershop.id, token),
      ]);
      if (nextMember.role === 'OWNER') throw new Error('Owner hesabı bu ekrandan düzenlenemez.');
      setMember(nextMember);
      setServices(nextServices);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : 'Çalışan yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [activeMembership, memberId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadMember();
    }, [loadMember]),
  );

  if (!activeMembership) return null;

  async function handleSubmit(values: BusinessMemberFormValues) {
    if (!activeMembership || !token || !memberId || !member) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const barbershopId = activeMembership.barbershop.id;
      await updateBusinessMember(
        barbershopId,
        memberId,
        { isActive: values.isActive, role: values.role },
        token,
      );

      if (values.isActive && values.role !== 'APPRENTICE') {
        await updateBusinessMemberBookable(
          barbershopId,
          memberId,
          values.isBookable,
          token,
        );
      }

      const currentServiceIds = new Set(
        member.serviceAssignments.map((assignment) => assignment.service.id),
      );
      const nextServiceIds = new Set(values.serviceIds);
      const serviceUpdates = [
        ...values.serviceIds
          .filter((serviceId) => !currentServiceIds.has(serviceId))
          .map((serviceId) =>
            assignBusinessMemberService(barbershopId, memberId, serviceId, token),
          ),
        ...[...currentServiceIds]
          .filter((serviceId) => !nextServiceIds.has(serviceId))
          .map((serviceId) =>
            unassignBusinessMemberService(barbershopId, memberId, serviceId, token),
          ),
      ];
      await Promise.all(serviceUpdates);
      router.dismissTo('/management/members');
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Çalışan güncellenemedi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => router.dismissTo('/management/members')}
          title="Çalışanı Düzenle"
        />
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          Rol, erişim ve hizmet yetkinliklerini güvenli biçimde güncelle.
        </AppText>

        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

        {!isLoading && loadError ? (
          <BusinessMemberState
            actionLabel="Tekrar Dene"
            description={loadError}
            error
            onAction={() => void loadMember()}
            title="Çalışan yüklenemedi"
          />
        ) : null}

        {!isLoading && !loadError && member ? (
          <BusinessMemberForm
            error={submitError}
            isSubmitting={isSubmitting}
            member={member}
            onSubmit={handleSubmit}
            services={services}
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: spacing.lg },
  subtitle: { fontSize: 11, lineHeight: 16, marginBottom: spacing.lg, marginTop: spacing.xs, textAlign: 'center' },
  loader: { marginTop: spacing.xxxl },
});
