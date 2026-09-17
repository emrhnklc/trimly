import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TrimlyLogo } from '@/components/branding/TrimlyLogo';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/features/auth/AuthProvider';
import { businessRoleLabels } from '@/features/business/role-labels';
import {
  acceptBusinessInvitation,
  getBusinessInvitationPreview,
} from '@/features/members/api';
import type { BusinessInvitationPreview } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const statusMessages = {
  EXPIRED: 'Bu davetin süresi dolmuş. İşletmeden yeni bir davet istemelisin.',
  REVOKED: 'Bu davet işletme tarafından iptal edilmiş.',
  USED: 'Bu davet daha önce kullanılmış.',
} as const;

export default function BusinessInvitationLinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const invitationToken = firstParam(params.token)?.trim() ?? '';
  const { refreshUser, token, user } = useAuth();
  const [invitation, setInvitation] = useState<BusinessInvitationPreview | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isAccepting, setAccepting] = useState(false);
  const [joinedBusiness, setJoinedBusiness] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvitation = useCallback(async () => {
    if (!invitationToken) {
      setError('Davet bağlantısı eksik veya geçersiz.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setInvitation(await getBusinessInvitationPreview(invitationToken));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davet bilgileri alınamadı.');
    } finally {
      setLoading(false);
    }
  }, [invitationToken]);

  useEffect(() => {
    const requestId = setTimeout(() => void loadInvitation(), 0);
    return () => clearTimeout(requestId);
  }, [loadInvitation]);

  async function acceptInvitation() {
    if (!token || !invitationToken || isAccepting) return;
    setAccepting(true);
    setError(null);
    try {
      const membership = await acceptBusinessInvitation(invitationToken, token);
      await refreshUser();
      setJoinedBusiness(membership.barbershop.name);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Davete katılınamadı.');
    } finally {
      setAccepting(false);
    }
  }

  const authParams = { invitationToken };
  const inactiveMessage = invitation && invitation.status !== 'ACTIVE'
    ? statusMessages[invitation.status]
    : null;

  return (
    <Screen>
      <View style={styles.content}>
        <TrimlyLogo style={styles.logo} />
        <AppCard style={styles.card}>
          <View style={styles.iconShell}>
            <SymbolView
              name={{ ios: 'person.badge.plus', android: 'group_add', web: 'group_add' }}
              size={34}
              tintColor={colors.primary}
            />
          </View>

          {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}

          {!isLoading && joinedBusiness ? (
            <>
              <AppText style={styles.title} variant="displayMedium">Ekibe katıldın</AppText>
              <AppText color="textMuted" style={styles.description}>
                {joinedBusiness} üyeliği hesabına eklendi.
              </AppText>
              <View style={styles.action}>
                <AppButton onPress={() => router.replace('/profiles')}>
                  Profillerimi Gör
                </AppButton>
              </View>
            </>
          ) : null}

          {!isLoading && !joinedBusiness && invitation ? (
            <>
              <AppText style={styles.title} variant="displayMedium">
                {invitation.barbershop.name}
              </AppText>
              <View style={styles.roleBadge}>
                <AppText color="primary" variant="label">
                  {businessRoleLabels[invitation.role]} daveti
                </AppText>
              </View>
              <AppText color="textMuted" style={styles.description}>
                {inactiveMessage ?? `Bu daveti kabul ettiğinde işletmeye ${businessRoleLabels[invitation.role]} olarak katılacaksın.`}
              </AppText>
              {invitation.status === 'ACTIVE' && !user ? (
                <>
                  <View style={styles.action}>
                    <AppButton onPress={() => router.push({ pathname: '/auth/login', params: authParams })}>
                      Giriş Yap ve Kabul Et
                    </AppButton>
                  </View>
                  <View style={styles.secondaryAction}>
                    <AppButton
                      onPress={() => router.push({ pathname: '/auth/register', params: authParams })}
                      variant="secondary">
                      Hesap Oluştur
                    </AppButton>
                  </View>
                </>
              ) : invitation.status === 'ACTIVE' ? (
                <View style={styles.action}>
                  <AppButton disabled={isAccepting} onPress={() => void acceptInvitation()}>
                    {isAccepting ? 'Katılım tamamlanıyor…' : 'Daveti Kabul Et'}
                  </AppButton>
                </View>
              ) : null}
            </>
          ) : null}

          {!isLoading && !joinedBusiness && error ? (
            <>
              <AppText color="danger" style={styles.description}>{error}</AppText>
              <View style={styles.action}>
                <AppButton onPress={() => void loadInvitation()} variant="secondary">Tekrar Dene</AppButton>
              </View>
            </>
          ) : null}
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', padding: spacing.lg },
  logo: { alignSelf: 'center', marginBottom: spacing.xxl },
  card: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  iconShell: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  loader: { marginTop: spacing.xl },
  title: { fontSize: 25, lineHeight: 32, marginTop: spacing.lg, textAlign: 'center' },
  roleBadge: {
    backgroundColor: '#FBF3DE',
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  description: { lineHeight: 21, marginTop: spacing.sm, textAlign: 'center' },
  action: { marginTop: spacing.xl, width: '100%' },
  secondaryAction: { marginTop: spacing.sm, width: '100%' },
});
