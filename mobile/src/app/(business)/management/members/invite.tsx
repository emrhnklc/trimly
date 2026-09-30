import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { Alert, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { InvitationForm } from '@/features/business-members/components/InvitationForm';
import type { AssignableBusinessRole } from '@/features/business-members/components/MemberRoleSelector';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { businessRoleLabels } from '@/features/business/role-labels';
import { createBusinessInvitationLink } from '@/features/members/deep-link';
import {
  createBusinessInvitation,
  getBusinessInvitations,
  revokeBusinessInvitation,
} from '@/features/members/api';
import type {
  BusinessInvitation,
  BusinessInvitationStatus,
  BusinessInvitationSummary,
} from '@/features/members/types';
import { goBackOrReplace } from '@/lib/navigation/goBackOrReplace';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export default function InviteBusinessMemberScreen() {
  const themeColors = useThemeColors();
  const router = useRouter();
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [invitation, setInvitation] = useState<BusinessInvitation | null>(null);
  const [invitations, setInvitations] = useState<BusinessInvitationSummary[]>([]);
  const [isSubmitting, setSubmitting] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvitations = useCallback(async () => {
    if (!activeMembership || !token) return;
    try {
      setInvitations(
        await getBusinessInvitations(activeMembership.barbershop.id, token),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davetler yüklenemedi.');
    }
  }, [activeMembership, token]);

  useFocusEffect(
    useCallback(() => {
      void loadInvitations();
    }, [loadInvitations]),
  );

  if (!activeMembership) return null;

  async function handleSubmit(role: AssignableBusinessRole, expiresInHours: number) {
    if (!activeMembership || !token) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await createBusinessInvitation(
        activeMembership.barbershop.id,
        { expiresInHours, role },
        token,
      );
      setInvitation(created);
      await loadInvitations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davet oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function shareInvitation() {
    if (!invitation || !activeMembership) return;
    const inviteUrl = createBusinessInvitationLink(invitation.token);
    await Share.share({
      message: `${activeMembership.barbershop.name} ekibine ${businessRoleLabels[invitation.role]} olarak katıl: ${inviteUrl}`,
      title: 'Trimly çalışan daveti',
      url: inviteUrl,
    });
  }

  function confirmRevoke(item: BusinessInvitationSummary) {
    Alert.alert(
      'Daveti iptal et',
      'Bu bağlantı hemen geçersiz olacak ve artık kullanılamayacak.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Daveti İptal Et', style: 'destructive', onPress: () => void revoke(item.id) },
      ],
    );
  }

  async function revoke(invitationId: string) {
    if (!activeMembership || !token || revokingId) return;
    setRevokingId(invitationId);
    setError(null);
    try {
      await revokeBusinessInvitation(
        activeMembership.barbershop.id,
        invitationId,
        token,
      );
      await loadInvitations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davet iptal edilemedi.');
    } finally {
      setRevokingId(null);
    }
  }

  const inviteUrl = invitation
    ? createBusinessInvitationLink(invitation.token)
    : null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => {
            if (source === 'profile') {
              goBackOrReplace(router, '/(business)/profile');
              return;
            }

            goBackOrReplace(router, '/(business)/management/members');
          }}
          title="Çalışan Daveti"
        />
        {invitation ? (
          <View style={[styles.successCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <View style={[styles.successIcon, { backgroundColor: themeColors.surfaceMuted }]}>
              <AppText color="primary" style={styles.checkmark} variant="heading">✓</AppText>
            </View>
            <AppText style={styles.successTitle} variant="heading">Davet hazır</AppText>
            <AppText color="textMuted" style={styles.successDescription} variant="bodySmall">
              {businessRoleLabels[invitation.role]} rolüyle oluşturuldu. Bağlantı bir kez kullanılabilir.
            </AppText>
            <View style={[styles.linkBox, { backgroundColor: themeColors.background, borderColor: themeColors.border }]}>
              <AppText selectable style={styles.link} variant="bodySmall">{inviteUrl}</AppText>
            </View>
            {inviteUrl ? (
              <View
                style={[
                  styles.qrShell,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}>
                <QRCode
                  backgroundColor={themeColors.surface}
                  color={themeColors.text}
                  quietZone={8}
                  size={176}
                  value={inviteUrl}
                />
              </View>
            ) : null}
            <AppText color="textMuted" style={styles.expiry} variant="bodySmall">
              Son kullanım: {new Intl.DateTimeFormat('tr-TR', {
                dateStyle: 'medium',
                timeStyle: 'short',
                timeZone: activeMembership.barbershop.timezone,
              }).format(new Date(invitation.expiresAt))}
            </AppText>
            <View style={styles.actions}>
              <AppButton onPress={() => void shareInvitation()}>Bağlantıyı Paylaş</AppButton>
              <AppButton onPress={() => setInvitation(null)} variant="ghost">Yeni Davet Oluştur</AppButton>
            </View>
          </View>
        ) : (
          <InvitationForm error={error} isSubmitting={isSubmitting} onSubmit={handleSubmit} />
        )}

        <View style={styles.historySection}>
          <AppText style={styles.historyTitle} variant="sectionTitle">Son Davetler</AppText>
          {invitations.length ? (
            <View style={styles.invitationList}>
              {invitations.map((item) => (
              <View key={item.id} style={[styles.invitationRow, { borderBottomColor: themeColors.border }]}>
                  <View style={styles.invitationCopy}>
                    <AppText variant="label">{businessRoleLabels[item.role]}</AppText>
                    <AppText color="textMuted" variant="bodySmall">
                      {invitationStatusLabel(item.status, item.acceptedBy)} · {formatExpiry(item.expiresAt, activeMembership.barbershop.timezone)}
                    </AppText>
                  </View>
                  {item.status === 'ACTIVE' ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={revokingId === item.id}
                      onPress={() => confirmRevoke(item)}
                      style={({ pressed }) => [styles.revokeButton, pressed && styles.pressed]}>
                      <AppText color="danger" variant="label">İptal Et</AppText>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : (
            <AppText color="textMuted" variant="bodySmall">Henüz çalışan daveti oluşturulmadı.</AppText>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: layout.screenHorizontalPadding },
  successCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.xl,
  },
  successIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  checkmark: { fontSize: 24, lineHeight: 30 },
  successTitle: { marginTop: spacing.md },
  successDescription: { marginTop: spacing.xs, textAlign: 'center' },
  linkBox: {
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.sm,
    width: '100%',
  },
  link: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
  qrShell: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: spacing.md,
    padding: spacing.xs,
  },
  expiry: { fontSize: 9, lineHeight: 13, marginTop: spacing.sm },
  actions: { gap: spacing.xs, marginTop: spacing.lg, width: '100%' },
  historySection: { marginTop: spacing.xxl },
  historyTitle: { marginBottom: spacing.sm },
  invitationList: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  invitationRow: {
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    minHeight: 68,
    padding: spacing.sm,
  },
  invitationCopy: { flex: 1, gap: 2 },
  revokeButton: { paddingHorizontal: spacing.xs, paddingVertical: spacing.sm },
  pressed: { opacity: 0.68 },
});

function invitationStatusLabel(
  status: BusinessInvitationStatus,
  acceptedBy: string | null,
) {
  if (status === 'USED') return acceptedBy ? `${acceptedBy} kullandı` : 'Kullanıldı';
  if (status === 'EXPIRED') return 'Süresi doldu';
  if (status === 'REVOKED') return 'İptal edildi';
  return 'Aktif';
}

function formatExpiry(value: string, timeZone: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(value));
}
