import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type MapPressEvent,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export type BusinessCoordinate = {
  latitude: number;
  longitude: number;
};

export function BusinessLocationMapPicker({
  initialCoordinate,
  initiallyConfirmed = false,
  onClose,
  onConfirm,
  visible,
}: {
  initialCoordinate: BusinessCoordinate;
  initiallyConfirmed?: boolean;
  onClose: () => void;
  onConfirm: (coordinate: BusinessCoordinate) => void;
  visible: boolean;
}) {
  const themeColors = useThemeColors();
  const [selectedCoordinate, setSelectedCoordinate] =
    useState(initialCoordinate);
  const [hasSelectedPoint, setHasSelectedPoint] = useState(initiallyConfirmed);

  function selectFromMap(event: MapPressEvent) {
    setHasSelectedPoint(true);
    setSelectedCoordinate(event.nativeEvent.coordinate);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} visible={visible}>
      <SafeAreaView
        style={[styles.modal, { backgroundColor: themeColors.background }]}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Haritayı kapat"
            hitSlop={10}
            onPress={onClose}
          >
            <SymbolView
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={22}
              tintColor={themeColors.text}
            />
          </Pressable>
          <AppText style={styles.title} variant="sectionTitle">
            İşletme Konumu
          </AppText>
          <View style={styles.headerSpacer} />
        </View>
        <AppText
          color="textMuted"
          style={styles.instruction}
          variant="bodySmall"
        >
          İşletmenin bulunduğu noktaya dokun veya işareti sürükle. Haritayı iki
          parmağınla yakınlaştırabilirsin.
        </AppText>
        <View style={[styles.mapShell, { borderColor: themeColors.border }]}>
          <MapView
            initialRegion={{
              ...initialCoordinate,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            onPress={selectFromMap}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            style={styles.map}
          >
            <Marker
              coordinate={selectedCoordinate}
              draggable
              onDragEnd={(event) => {
                setHasSelectedPoint(true);
                setSelectedCoordinate(event.nativeEvent.coordinate);
              }}
              pinColor={themeColors.primary}
              title="İşletme konumu"
            />
          </MapView>
        </View>
        <View style={styles.coordinateRow}>
          <SymbolView
            name={{
              ios: "mappin.circle.fill",
              android: "location_on",
              web: "location_on",
            }}
            size={20}
            tintColor={themeColors.primary}
          />
          <AppText
            color="textMuted"
            numberOfLines={1}
            style={styles.coordinateText}
            variant="bodySmall"
          >
            {hasSelectedPoint
              ? `Seçilen nokta: ${selectedCoordinate.latitude.toFixed(5)}, ${selectedCoordinate.longitude.toFixed(5)}`
              : "Onaylamak için haritada işletmenin noktasına dokun."}
          </AppText>
        </View>
        <View style={styles.confirm}>
          <AppButton
            disabled={!hasSelectedPoint}
            onPress={() => onConfirm(selectedCoordinate)}
          >
            Bu Konumu Kullan
          </AppButton>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  header: { alignItems: "center", flexDirection: "row", minHeight: 58 },
  title: { flex: 1, fontSize: 22, lineHeight: 28, textAlign: "center" },
  headerSpacer: { width: 22 },
  instruction: {
    lineHeight: 19,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  mapShell: {
    borderRadius: radius.card,
    borderWidth: 1,
    flex: 1,
    minHeight: 360,
    overflow: "hidden",
  },
  map: { height: "100%", width: "100%" },
  coordinateRow: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: spacing.md,
  },
  coordinateText: { flex: 1, marginLeft: spacing.xs },
  confirm: { marginBottom: spacing.sm, marginTop: spacing.md },
});
