import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { AppCard } from "@/components/ui/AppCard";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { PublicWorkingHours } from "./PublicWorkingHours";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import {
  formatBusinessLocation,
  formatBusinessPhone,
} from "@/features/barbershops/profile-formatters";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function BarbershopInfoCard({
  barbershop,
}: {
  barbershop: PublicBarbershopDetail;
}) {
  const [hoursVisible, setHoursVisible] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: barbershop.timezone,
    weekday: "long",
  })
    .format(now)
    .toUpperCase();
  const hours = barbershop.workingHours?.find(
    (item) => item.weekday === weekday,
  );
  const hoursText = hours
    ? hours.startTime + " – " + hours.endTime
    : barbershop.workingHours?.length
      ? "Bugün kapalı"
      : "Saatler eklenmemiş";
  const hasCoordinates =
    barbershop.latitude != null && barbershop.longitude != null;
  async function openLocation() {
    if (!hasCoordinates) return;
    const destination = barbershop.latitude + "," + barbershop.longitude;
    const url =
      Platform.OS === "ios"
        ? "http://maps.apple.com/?ll=" +
          destination +
          "&q=" +
          encodeURIComponent(barbershop.name)
        : "https://www.google.com/maps/search/?api=1&query=" + destination;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Harita açılamadı",
        "Harita uygulamanı kontrol edip tekrar dene.",
      );
    }
  }
  async function openPhone() {
    if (!barbershop.phone) return;
    try {
      await Linking.openURL("tel:" + barbershop.phone.replace(/[^+\d]/g, ""));
    } catch {
      Alert.alert(
        "Telefon açılamadı",
        "Telefon uygulamanı kontrol edip tekrar dene.",
      );
    }
  }
  return (
    <>
      <View style={styles.row}>
        <InfoCell
          title="Konum"
          value={formatBusinessLocation(barbershop.address)}
          icon={{
            ios: "mappin.circle.fill",
            android: "location_on",
            web: "location_on",
          }}
          disabled={!hasCoordinates}
          onPress={() => void openLocation()}
        />
        <InfoCell
          title="İletişim"
          singleLine
          value={formatBusinessPhone(barbershop.phone)}
          icon={{ ios: "phone.fill", android: "call", web: "call" }}
          disabled={!barbershop.phone}
          onPress={() => void openPhone()}
        />
        <InfoCell
          title="Çalışma Saatleri"
          value={hoursText}
          icon={{ ios: "clock.fill", android: "schedule", web: "schedule" }}
          onPress={() => setHoursVisible(true)}
        />
      </View>
      <Modal
        visible={hoursVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHoursVisible(false)}
      >
        <SafeAreaView style={styles.modal}>
          <Pressable
            accessibilityLabel="Çalışma saatlerini kapat"
            style={styles.backdrop}
            onPress={() => setHoursVisible(false)}
          />
          <AppCard style={styles.dialog}>
            <AppText variant="sectionTitle">Çalışma Saatleri</AppText>
            <AppText color="textMuted" variant="bodySmall">
              {barbershop.name}
            </AppText>
            <ScrollView>
              <PublicWorkingHours business={barbershop} />
            </ScrollView>
            <AppButton onPress={() => setHoursVisible(false)}>Kapat</AppButton>
          </AppCard>
        </SafeAreaView>
      </Modal>
    </>
  );
}
function InfoCell({
  title,
  value,
  icon,
  onPress,
  disabled = false,
  singleLine = false,
}: {
  title: string;
  value: string;
  icon: SymbolViewProps["name"];
  onPress: () => void;
  disabled?: boolean;
  singleLine?: boolean;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + ": " + value}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.cellHeading}>
        <View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView name={icon} size={18} tintColor={colors.primary} />
        </View>
        <AppText variant="label" style={styles.title}>
          {title}
        </AppText>
      </View>
      <View style={styles.valueRow}>
        <AppText
          variant="bodySmall"
          numberOfLines={singleLine ? 1 : 3}
          adjustsFontSizeToFit={singleLine}
          minimumFontScale={0.85}
          style={[styles.value, singleLine && styles.phoneValue]}
        >
          {value}
        </AppText>
        {!disabled ? (
          <SymbolView
            name={{
              ios: "chevron.right",
              android: "chevron_right",
              web: "chevron_right",
            }}
            size={12}
            tintColor={colors.textMuted}
          />
        ) : null}
      </View>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: spacing.xs },
  cell: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  cellHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 32,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { flex: 1, fontSize: 12, lineHeight: 16 },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    minHeight: 34,
  },
  value: { flex: 1, fontSize: 12, lineHeight: 17 },
  phoneValue: { letterSpacing: -0.35 },
  modal: { flex: 1, justifyContent: "center", padding: spacing.lg },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dialog: { maxHeight: "90%", gap: spacing.sm },
});
