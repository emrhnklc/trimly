import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
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
  confirmBusinessOwnershipTransfer,
  getBusinessMember,
  requestBusinessOwnershipTransfer,
  unassignBusinessMemberService,
  updateBusinessMember,
  updateBusinessMemberBookable,
} from '@/features/members/api';
import type { BusinessMember } from '@/features/members/types';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { colors } from '@/theme/colors';
import { layout, spacing } from '@/theme/spacing';

export default function EditBusinessMemberScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();
  const { token } = useAuth();
  const { activeMembership, can } = useBusiness();
  const [member, setMember] = useState<BusinessMember | null>(null);
  const [services, setServices] = useState<ManagementService[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isSubmitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [transferCode, setTransferCode] = useState('');
  const [devTransferCode, setDevTransferCode] = useState<string | null>(null);
  const [isTransferPending, setTransferPending] = useState(false);
  const [isTransferring, setTransferring] = useState(false);

  const loadMember = useCallback(async () => {
    if (!activeMembership || !token || !memberId) return;

    setLoading(true);
    setLoadError(null);
    try {
      const [nextMember, nextServices] = await Promise.all([
        getBusinessMember(activeMembership.barbershop.id, memberId, token),
        getManagementServices(activeMembership.barbershop.id, token),
      ]);
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
      if (can('EDIT_MEMBER_ROLE_AND_STATUS') && member.role !== 'OWNER') {
        await updateBusinessMember(
          barbershopId,
          memberId,
          { isActive: values.isActive, role: values.role },
          token,
        );
      }

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

  async function requestTransfer() {
    if (!activeMembership || !token || !memberId || !member) return;
    setTransferring(true);
    setSubmitError(null);
    try {
      const result = await requestBusinessOwnershipTransfer(
        activeMembership.barbershop.id,
        memberId,
        token,
      );
      setDevTransferCode(result.devOwnershipTransferCode ?? null);
      setTransferPending(true);
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Doğrulama kodu gönderilemedi.');
    } finally {
      setTransferring(false);
    }
  }

  function confirmTransferRequest() {
    if (!member) return;
    Alert.alert(
      'Sahipliği devret',
      `${member.user.firstName} ${member.user.lastName} işletmenin yeni sahibi olur. Sen yönetici olarak kalırsın. Devam etmek için e-posta kodu gönderilsin mi?`,
      [
        { style: 'cancel', text: 'Vazgeç' },
        { onPress: () => void requestTransfer(), style: 'destructive', text: 'Kod gönder' },
      ],
    );
  }

  async function confirmTransfer() {
    if (!activeMembership || !token || !memberId || transferCode.length !== 6) {
      setSubmitError('E-postana gelen 6 haneli kodu girmelisin.');
      return;
    }
    setTransferring(true);
    setSubmitError(null);
    try {
      await confirmBusinessOwnershipTransfer(
        activeMembership.barbershop.id,
        memberId,
        transferCode,
        token,
      );
      router.dismissTo('/management/members');
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Sahiplik devredilemedi.');
    } finally {
      setTransferring(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => goBackOrReplace(router, '/(business)/management/members')}
          title="Çalışanı Düzenle"
        />
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
          <>
            <BusinessMemberForm
              canEditRoleAndStatus={can('EDIT_MEMBER_ROLE_AND_STATUS')}
              error={submitError}
              isSubmitting={isSubmitting}
              member={member}
              onSubmit={handleSubmit}
              services={services}
            />
            {activeMembership.role === 'OWNER' && member.role !== 'OWNER' && member.isActive ? (
            <View style={styles.transferCard}>
              <AppText color="danger" variant="heading">İşletme sahipliğini devret</AppText>
              <AppText color="textMuted" style={styles.transferCopy} variant="bodySmall">
                Bu çalışan yeni sahip olur; sen yönetici olarak işletmede kalırsın.
              </AppText>
              {isTransferPending ? (
                <>
                  <AuthTextField
                    icon={{ ios: 'number', android: 'pin', web: 'pin' }}
                    keyboardType="number-pad"
                    label="E-posta doğrulama kodu"
                    maxLength={6}
                    onChangeText={(value) => setTransferCode(value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    value={transferCode}
                  />
                  {devTransferCode ? (
                    <AppText color="primary" style={styles.devCode} variant="label">
                      Geliştirme kodu: {devTransferCode}
                    </AppText>
                  ) : null}
                  <AppButton disabled={isTransferring} onPress={() => void confirmTransfer()} variant="secondary">
                    {isTransferring ? 'Devrediliyor…' : 'Sahipliği Onayla ve Devret'}
                  </AppButton>
                </>
              ) : (
                <AppButton disabled={isTransferring} onPress={confirmTransferRequest} variant="secondary">
                  {isTransferring ? 'Kod gönderiliyor…' : 'Sahipliği Devret'}
                </AppButton>
              )}
            </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  loader: { marginTop: spacing.xxxl },
  transferCard: {
    borderColor: '#E8C8C5',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  transferCopy: { lineHeight: 18, marginBottom: spacing.md, marginTop: spacing.xs },
  devCode: { marginBottom: spacing.sm },
});
