import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { InvitationForm } from '@/features/business-members/components/InvitationForm';
import type { AssignableBusinessRole } from '@/features/business-members/components/MemberRoleSelector';
import { useBusiness } from '@/features/business/BusinessProvider';
import { BusinessDetailHeader } from '@/features/business/components/BusinessDetailHeader';
import { businessRoleLabels } from '@/features/business/role-labels';
import { createBusinessInvitation } from '@/features/members/api';
import type { BusinessInvitation } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export default function InviteBusinessMemberScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { activeMembership } = useBusiness();
  const [invitation, setInvitation] = useState<BusinessInvitation | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!activeMembership) return null;

  async function handleSubmit(role: AssignableBusinessRole, expiresInHours: number) {
    if (!activeMembership || !token) return;

    setSubmitting(true);
    setError(null);
    try {
      setInvitation(
        await createBusinessInvitation(
          activeMembership.barbershop.id,
          { expiresInHours, role },
          token,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davet oluşturulamadı.');
    } finally {
      setSubmitting(false);
    }
  }

  async function shareInvitation() {
    if (!invitation || !activeMembership) return;
    await Share.share({
      message: `${activeMembership.barbershop.name} ekibine ${businessRoleLabels[invitation.role]} olarak katıl: ${invitation.inviteUrl}`,
      title: 'Trimly çalışan daveti',
      url: invitation.inviteUrl,
    });
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BusinessDetailHeader
          onBack={() => router.dismissTo('/management/members')}
          title="Çalışan Daveti"
        />
        <AppText color="textMuted" style={styles.subtitle} variant="bodySmall">
          Tek kullanımlık bağlantı oluştur ve çalışanınla güvenli biçimde paylaş.
        </AppText>

        {invitation ? (
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <AppText color="primary" style={styles.checkmark} variant="heading">✓</AppText>
            </View>
            <AppText style={styles.successTitle} variant="heading">Davet hazır</AppText>
            <AppText color="textMuted" style={styles.successDescription} variant="bodySmall">
              {businessRoleLabels[invitation.role]} rolüyle oluşturuldu. Bağlantı bir kez kullanılabilir.
            </AppText>
            <View style={styles.linkBox}>
              <AppText selectable style={styles.link} variant="bodySmall">{invitation.inviteUrl}</AppText>
            </View>
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
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 116, paddingHorizontal: spacing.lg },
  subtitle: { fontSize: 11, lineHeight: 16, marginBottom: spacing.lg, marginTop: spacing.xs, textAlign: 'center' },
  successCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.xl,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: '#F4E7C8',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  checkmark: { fontSize: 24, lineHeight: 30 },
  successTitle: { marginTop: spacing.md },
  successDescription: { marginTop: spacing.xs, textAlign: 'center' },
  linkBox: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.lg,
    padding: spacing.sm,
    width: '100%',
  },
  link: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
  expiry: { fontSize: 9, lineHeight: 13, marginTop: spacing.sm },
  actions: { gap: spacing.xs, marginTop: spacing.lg, width: '100%' },
});
