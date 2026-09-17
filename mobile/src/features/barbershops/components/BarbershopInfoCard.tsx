import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";

import * as Linking from "expo-linking";
import { SymbolView } from "expo-symbols";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import type { PublicBarbershopDetail } from "@/features/barbershops/types";
import { spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

type BarbershopInfoCardProps = {
  barbershop: PublicBarbershopDetail;
};

export function BarbershopInfoCard({ barbershop }: BarbershopInfoCardProps) {
  const colors = useThemeColors();
  const hasCoordinates =
    barbershop.latitude !== null && barbershop.longitude !== null;

  async function openLocation() {
    if (!hasCoordinates) return;
    const destination = `${barbershop.latitude},${barbershop.longitude}`;
    const url =
      Platform.OS === "ios"
        ? `http://maps.apple.com/?ll=${destination}&q=${encodeURIComponent(barbershop.name)}`
        : `https://www.google.com/maps/search/?api=1&query=${destination}`;
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
    const phoneNumber = barbershop.phone.replace(/[^+\d]/g, "");
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch {
      Alert.alert(
        "Telefon açılamadı",
        "Telefon uygulamanı kontrol edip tekrar dene.",
      );
    }
  }

  return (
    <AppCard style={styles.card}>
      <LocationCell
        address={barbershop.address || "Adres eklenmemiş"}
        buttonColor={colors.primary}
        disabled={!hasCoordinates}
        onPress={() => void openLocation()}
        shopName={barbershop.name}
      />
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <ContactCell
        buttonColor={colors.primary}
        disabled={!barbershop.phone}
        onPress={() => void openPhone()}
        phone={barbershop.phone || "Telefon eklenmemiş"}
        shopName={barbershop.name}
      />
    </AppCard>
  );
}

function LocationCell({
  address,
  buttonColor,
  disabled,
  onPress,
  shopName,
}: {
  address: string;
  buttonColor: string;
  disabled: boolean;
  onPress: () => void;
  shopName: string;
}) {
  return (
    <View style={styles.locationCell}>
      <AppText color="textMuted" variant="bodySmall">
        Konum
      </AppText>
      <View style={styles.locationRow}>
        <Pressable
          accessibilityLabel={`${shopName} konumunu haritada aç`}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={8}
          onPress={onPress}
          style={({ pressed }) => [
            styles.locationButton,
            { backgroundColor: buttonColor },
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "map.fill", android: "map", web: "map" }}
            size={18}
            tintColor="#FFFFFF"
          />
        </Pressable>
        <AppText numberOfLines={2} style={styles.locationValue} variant="label">
          {address}
        </AppText>
      </View>
    </View>
  );
}

function ContactCell({
  buttonColor,
  disabled,
  onPress,
  phone,
  shopName,
}: {
  buttonColor: string;
  disabled: boolean;
  onPress: () => void;
  phone: string;
  shopName: string;
}) {
  return (
    <View style={styles.contactCell}>
      <AppText color="textMuted" variant="bodySmall">
        İletişim
      </AppText>
      <View style={styles.contactRow}>
        <Pressable
          accessibilityLabel={`${shopName} işletmesini ara`}
          accessibilityRole="button"
          disabled={disabled}
          hitSlop={8}
          onPress={onPress}
          style={({ pressed }) => [
            styles.contactButton,
            { backgroundColor: buttonColor },
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={{ ios: "phone.fill", android: "call", web: "call" }}
            size={17}
            tintColor="#FFFFFF"
          />
        </Pressable>
        <AppText numberOfLines={1} style={styles.contactValue} variant="label">
          {phone}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 88,
    paddingVertical: spacing.sm,
  },
  locationCell: { flex: 1 },
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  locationButton: {
    alignItems: "center",
    borderRadius: 9,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  locationValue: { flex: 1 },
  contactCell: { flex: 1 },
  contactRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xxs,
    marginTop: spacing.xs,
  },
  contactButton: {
    alignItems: "center",
    borderRadius: 9,
    height: 32,
    justifyContent: "center",
    width: 32,
  },
  contactValue: { flex: 1, fontSize: 12, lineHeight: 16 },
  divider: { height: 52, marginHorizontal: spacing.xs, width: 1 },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.4 },
});
