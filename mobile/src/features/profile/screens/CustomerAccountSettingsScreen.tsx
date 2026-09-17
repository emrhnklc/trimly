import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { type ReactNode } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { Screen } from "@/components/ui/Screen";
import { SettingsPageHeader } from "@/components/ui/SettingsPageHeader";
import { colors } from "@/theme/colors";
import { layout, radius, spacing } from "@/theme/spacing";

export function CustomerAccountSettingsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SettingsPageHeader title="Hesap Ayarları" />

        <SettingsSection title="Hesabım">
          <SettingsRow icon={{ ios: "person", android: "person", web: "person" }} isLast label="Hesap Bilgileri" onPress={() => router.push("/profile/edit")} />
        </SettingsSection>

        <SettingsSection title="Güvenlik">
          <SettingsRow icon={{ ios: "lock", android: "lock", web: "lock" }} label="Şifre Değiştir" onPress={() => router.push("/password/change")} />
          <SettingsRow badge="YAKINDA" icon={{ ios: "link", android: "link", web: "link" }} label="Bağlı Hesaplar" />
          <SettingsRow icon={{ ios: "laptopcomputer", android: "devices", web: "devices" }} isLast label="Aktif Oturumlar" onPress={() => router.push('/sessions')} />
        </SettingsSection>

        <SettingsSection title="Veri & Gizlilik">
          <SettingsRow icon={{ ios: "arrow.down.to.line", android: "download", web: "download" }} label="Verilerimi İndir" onPress={() => router.push('/data-export')} />
          <SettingsRow danger icon={{ ios: "trash", android: "delete", web: "delete" }} isLast label="Hesabı Sil" onPress={() => router.push('/account-delete')} />
        </SettingsSection>
      </ScrollView>
    </Screen>
  );
}

function SettingsSection({ children, title }: { children: ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <AppText style={styles.sectionTitle} variant="sectionTitle">{title}</AppText>
      <AppCard style={styles.sectionCard}>{children}</AppCard>
    </View>
  );
}

type SettingsRowProps = {
  badge?: string;
  danger?: boolean;
  icon: SymbolViewProps["name"];
  isLast?: boolean;
  label: string;
  onPress?: () => void;
};

function SettingsRow({ badge, danger = false, icon, isLast = false, label, onPress }: SettingsRowProps) {
  const content = (
    <>
      <View style={[styles.rowIcon, danger && styles.dangerIcon]}><SymbolView name={icon} size={19} tintColor={danger ? colors.danger : colors.primary} /></View>
      <AppText color={danger ? "danger" : "text"} style={styles.rowLabel}>{label}</AppText>
      {badge ? <AppText color="textMuted" style={styles.badge} variant="overline">{badge}</AppText> : null}
      <SymbolView name={{ ios: "chevron.right", android: "chevron_right", web: "chevron_right" }} size={17} tintColor={onPress ? colors.textMuted : colors.border} />
    </>
  );
  if (!onPress) return <View style={[styles.row, !isLast && styles.divider, styles.disabled]}>{content}</View>;
  return <Pressable accessibilityLabel={label} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !isLast && styles.divider, pressed && styles.pressed]}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: layout.screenHorizontalPadding },
  section: { marginTop: layout.sectionGap },
  sectionTitle: { fontSize: 22, lineHeight: 28, marginBottom: spacing.sm },
  sectionCard: { paddingHorizontal: spacing.sm, paddingVertical: 0 },
  row: { alignItems: "center", flexDirection: "row", minHeight: 54, paddingHorizontal: spacing.xs },
  divider: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  rowIcon: { alignItems: "center", backgroundColor: colors.background, borderRadius: radius.pill, height: 32, justifyContent: "center", width: 32 },
  dangerIcon: { backgroundColor: "#F8E8E5" },
  rowLabel: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.sm },
  badge: { fontSize: 9, letterSpacing: 0.7, marginRight: spacing.xs },
  disabled: { opacity: 0.66 },
  pressed: { opacity: 0.62 },
});
