import { useLocalSearchParams, useRouter } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppIconButton } from "@/components/ui/AppIconButton";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { layout, spacing } from "@/theme/spacing";

export default function LegalDocumentScreen() {
  const router = useRouter();
  const { document } = useLocalSearchParams<{ document: string }>();
  const isPrivacy = document === "privacy";

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <AppIconButton
            accessibilityLabel="Kayıt ekranına dön"
            icon={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
            onPress={() => router.back()}
            variant="transparent"
          />
          <AppText style={styles.title} variant="sectionTitle">
            {isPrivacy ? "Gizlilik Politikası" : "Kullanım Koşulları"}
          </AppText>
          <View style={styles.spacer} />
        </View>
        <AppCard style={styles.card}>
          <AppText color="primary" variant="overline">YAYIN ÖNCESİ TASLAK</AppText>
          <AppText style={styles.heading} variant="heading">
            {isPrivacy ? "Verilerin hakkında" : "Trimly kullanımı hakkında"}
          </AppText>
          <AppText color="textMuted">
            Bu yasal metin, uygulama yayına alınmadan önce şirket bilgileri,
            veri saklama süreleri ve hizmet koşullarıyla birlikte hukuk
            danışmanı tarafından tamamlanacaktır.
          </AppText>
        </AppCard>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: layout.screenHorizontalPadding },
  topBar: { alignItems: "center", flexDirection: "row", paddingTop: spacing.xs },
  title: { flex: 1, textAlign: "center" },
  spacer: { width: 44 },
  card: { marginTop: spacing.xl },
  heading: { marginBottom: spacing.sm, marginTop: spacing.xs },
});
