import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { Screen } from '@/components/ui/Screen';
import { SettingsPageHeader } from '@/components/ui/SettingsPageHeader';
import { exportMyData } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

export default function DataExportScreen() {
  const { token } = useAuth();
  const [isExporting, setExporting] = useState(false);

  async function downloadData() {
    if (!token || isExporting) return;
    setExporting(true);
    try {
      const data = await exportMyData(token);
      const file = new File(Paths.cache, `trimly-verilerim-${new Date().toISOString().slice(0, 10)}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify(data, null, 2));
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Dosya hazır', 'Bu cihazda paylaşım kullanılamıyor. Dosya uygulamanın geçici klasörüne kaydedildi.');
        return;
      }
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json' });
    } catch (reason) {
      Alert.alert('Veriler indirilemedi', reason instanceof Error ? reason.message : 'Lütfen tekrar dene.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <View style={styles.content}>
        <SettingsPageHeader title="Verilerimi İndir" />
        <AppCard style={styles.card}>
          <AppText style={styles.heading} variant="heading">Kişisel veri dışa aktarma</AppText>
          <AppText color="textMuted" style={styles.copy} variant="bodySmall">
            Profilin, müşteri randevuların, favorilerin, stil geçmişin ve bildirim tercihlerin JSON dosyası olarak hazırlanır.
          </AppText>
          <AppText color="textMuted" style={styles.note} variant="bodySmall">
            Şifren, erişim kodların ve oturum bilgilerin bu dosyaya dahil edilmez.
          </AppText>
          <View style={styles.action}><AppButton disabled={isExporting} onPress={() => void downloadData()}>{isExporting ? 'Dosya hazırlanıyor…' : 'Verilerimi İndir'}</AppButton></View>
        </AppCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.md },
  card: { marginTop: spacing.xl, padding: spacing.lg },
  heading: { fontSize: 18, lineHeight: 24 },
  copy: { lineHeight: 20, marginTop: spacing.sm },
  note: { color: colors.textMuted, lineHeight: 19, marginTop: spacing.lg },
  action: { marginTop: spacing.xl },
});
