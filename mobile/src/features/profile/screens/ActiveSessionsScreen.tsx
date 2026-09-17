import { SymbolView } from 'expo-symbols';
import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { getActiveSessions, revokeOtherSessions, revokeSession, type ActiveSession } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  month: 'long',
  year: 'numeric',
});

export function ActiveSessionsScreen() {
  const router = useRouter();
  const { signOut, token } = useAuth();
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [isMutating, setMutating] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setSessions(await getActiveSessions(token));
    } catch (reason) {
      Alert.alert('Oturumlar yüklenemedi', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => {
    void loadSessions();
  }, [loadSessions]));

  function confirmRevoke(session: ActiveSession) {
    Alert.alert(
      session.isCurrent ? 'Bu cihazdan çıkılsın mı?' : 'Bu oturum kapatılsın mı?',
      session.isCurrent ? 'Bu cihazdaki hesabından çıkış yapacaksın.' : `${session.deviceName} üzerindeki erişim sona erecek.`,
      [
        { style: 'cancel', text: 'Vazgeç' },
        { style: 'destructive', text: 'Oturumu Kapat', onPress: () => void closeSession(session) },
      ],
    );
  }

  async function closeSession(session: ActiveSession) {
    if (!token || isMutating) return;
    setMutating(true);
    try {
      await revokeSession(session.id, token);
      if (session.isCurrent) {
        await signOut();
        router.replace('/auth/login');
      } else {
        setSessions((current) => current.filter((item) => item.id !== session.id));
      }
    } catch (reason) {
      Alert.alert('Oturum kapatılamadı', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    } finally {
      setMutating(false);
    }
  }

  function confirmRevokeOthers() {
    const otherCount = sessions.filter((session) => !session.isCurrent).length;
    if (!otherCount) return;
    Alert.alert('Diğer cihazlardan çıkılsın mı?', `${otherCount} aktif oturum kapatılacak. Bu cihaz açık kalır.`, [
      { style: 'cancel', text: 'Vazgeç' },
      { style: 'destructive', text: 'Diğerlerinden Çıkış Yap', onPress: () => void closeOtherSessions() },
    ]);
  }

  async function closeOtherSessions() {
    if (!token || isMutating) return;
    setMutating(true);
    try {
      await revokeOtherSessions(token);
      setSessions((current) => current.filter((session) => session.isCurrent));
    } catch (reason) {
      Alert.alert('Oturumlar kapatılamadı', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    } finally {
      setMutating(false);
    }
  }

  const hasOtherSessions = sessions.some((session) => !session.isCurrent);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Aktif Oturumlar" />
        <AppText color="textMuted" style={styles.intro} variant="bodySmall">Hesabının açık olduğu cihazları buradan yönetebilirsin.</AppText>

        {isLoading ? <AppText color="textMuted" style={styles.status} variant="bodySmall">Oturumların yükleniyor…</AppText> : null}
        {!isLoading && sessions.length === 0 ? <AppText color="textMuted" style={styles.status} variant="bodySmall">Aktif oturum bulunamadı.</AppText> : null}
        {!isLoading && sessions.length > 0 ? (
          <AppCard style={styles.card}>
            {sessions.map((session, index) => (
              <Pressable accessibilityLabel={`${session.deviceName} oturumunu kapat`} accessibilityRole="button" key={session.id} onPress={() => confirmRevoke(session)} style={({ pressed }) => [styles.row, index < sessions.length - 1 && styles.divider, pressed && styles.pressed]}>
                <View style={styles.iconShell}><SymbolView name={{ ios: 'laptopcomputer', android: 'devices', web: 'devices' }} size={20} tintColor={colors.primary} /></View>
                <View style={styles.rowContent}>
                  <View style={styles.nameLine}>
                    <AppText style={styles.deviceName}>{session.deviceName}</AppText>
                    {session.isCurrent ? <View style={styles.currentBadge}><AppText color="primary" style={styles.currentLabel} variant="overline">BU CİHAZ</AppText></View> : null}
                  </View>
                  <AppText color="textMuted" style={styles.date} variant="bodySmall">Son etkinlik: {dateFormatter.format(new Date(session.lastActiveAt))}</AppText>
                </View>
                <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={17} tintColor={colors.textMuted} />
              </Pressable>
            ))}
          </AppCard>
        ) : null}

        {hasOtherSessions ? <View style={styles.otherSessionsButton}><AppButton disabled={isMutating} onPress={confirmRevokeOthers} variant="secondary">Diğer Tüm Cihazlardan Çıkış Yap</AppButton></View> : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md },
  intro: { lineHeight: 20, marginTop: spacing.md, textAlign: 'center' },
  status: { marginTop: spacing.xxl, textAlign: 'center' },
  card: { marginTop: spacing.xl, paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 72, paddingHorizontal: spacing.xs },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  iconShell: { alignItems: 'center', backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, height: 38, justifyContent: 'center', width: 38 },
  rowContent: { flex: 1, marginLeft: spacing.sm },
  nameLine: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  deviceName: { fontSize: 14, lineHeight: 19 },
  currentBadge: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 3 },
  currentLabel: { fontSize: 8, letterSpacing: 0.6 },
  date: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  otherSessionsButton: { marginTop: spacing.xl },
  pressed: { opacity: 0.62 },
});
