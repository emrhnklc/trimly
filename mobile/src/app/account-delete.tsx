import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { confirmAccountDeletion, requestAccountDeletion } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { AuthTextField } from '@/features/auth/components/AuthTextField';
import { spacing } from '@/theme/spacing';

export default function AccountDeleteScreen() {
  const router = useRouter(); const { signOut, token } = useAuth();
  const [code, setCode] = useState(''); const [devCode, setDevCode] = useState<string | null>(null);
  const [ownerBusinesses, setOwnerBusinesses] = useState<string[]>([]); const [step, setStep] = useState<'intro' | 'verify' | 'blocked'>('intro'); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function request() { if (!token || busy) return; setBusy(true); setError(null); try { const result = await requestAccountDeletion(token); if (result.requiresOwnershipResolution) { setOwnerBusinesses(result.ownerBusinesses ?? []); setStep('blocked'); } else { setDevCode(result.devDeletionCode ?? null); setStep('verify'); } } catch (reason) { setError(reason instanceof Error ? reason.message : 'İşlem başlatılamadı.'); } finally { setBusy(false); } }
  async function remove() { if (!token || code.length !== 6) { setError('E-postana gelen 6 haneli kodu girmelisin.'); return; } setBusy(true); setError(null); try { await confirmAccountDeletion(code, token); await signOut(); router.replace('/auth/login'); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Hesap silinemedi.'); } finally { setBusy(false); } }
  return <Screen><ScrollView contentContainerStyle={styles.content}><SettingsPageHeader title="Hesabı Sil" /><AppCard style={styles.card}>{step === 'blocked' ? <><AppText color="danger" variant="heading">Önce işletme sahipliğini devretmelisin</AppText><AppText color="textMuted" style={styles.copy}>Şu işletmelerin sahibi olduğun için hesabın silinemez: {ownerBusinesses.join(', ')}.</AppText><View style={styles.action}><AppButton onPress={() => router.push('/management/members')} variant="secondary">Çalışanlardan Yeni Sahibi Seç</AppButton></View></> : step === 'verify' ? <><AppText variant="heading">Son doğrulama</AppText><AppText color="textMuted" style={styles.copy}>E-postana gönderdiğimiz kodu gir. Bu işlem geri alınamaz.</AppText><AuthTextField icon={{ ios: 'number', android: 'pin', web: 'pin' }} keyboardType="number-pad" label="6 haneli kod" maxLength={6} onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" value={code} />{devCode ? <AppText color="primary" style={styles.dev} variant="label">Geliştirme kodu: {devCode}</AppText> : null}<View style={styles.action}><AppButton disabled={busy} onPress={() => void remove()} variant="secondary">{busy ? 'Siliniyor…' : 'Hesabımı Kalıcı Olarak Sil'}</AppButton></View></> : <><AppText color="danger" variant="heading">Bu işlem geri alınamaz</AppText><AppText color="textMuted" style={styles.copy}>Profilin, favorilerin, bildirimlerin ve stil geçmişin silinir. Gelecekteki randevuların iptal edilir; işletme geçmişindeki eski randevular anonim kalır.</AppText><View style={styles.action}><AppButton disabled={busy} onPress={() => void request()} variant="secondary">{busy ? 'Kontrol ediliyor…' : 'E-posta Doğrulama Kodu Gönder'}</AppButton></View></>}{error ? <AppText color="danger" style={styles.error}>{error}</AppText> : null}</AppCard></ScrollView></Screen>;
}
const styles = StyleSheet.create({ content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.md }, card: { marginTop: spacing.xl, padding: spacing.lg }, copy: { lineHeight: 20, marginTop: spacing.md }, action: { marginTop: spacing.xl }, error: { marginTop: spacing.md }, dev: { marginTop: spacing.md } });
