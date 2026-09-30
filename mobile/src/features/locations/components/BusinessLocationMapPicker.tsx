import { SymbolView } from "expo-symbols";
import * as Location from "expo-location";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
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

type SearchResult = BusinessCoordinate & { id: string; label: string };

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
  const mapRef = useRef<MapView>(null);
  const [selectedCoordinate, setSelectedCoordinate] =
    useState(initialCoordinate);
  const [hasSelectedPoint, setHasSelectedPoint] = useState(initiallyConfirmed);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setSearching] = useState(false);

  function selectFromMap(event: MapPressEvent) {
    setHasSelectedPoint(true);
    setSelectedCoordinate(event.nativeEvent.coordinate);
    setSearchResults([]);
  }

  async function searchLocation() {
    const query = searchText.trim();
    if (query.length < 3) {
      setSearchError("Aramak için en az 3 karakter yaz.");
      return;
    }

    Keyboard.dismiss();
    setSearching(true);
    setSearchError(null);
    setSearchResults([]);
    try {
      if (Platform.OS === "android") {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!permission.granted) {
          setSearchError("Haritada arama yapmak için konum izni vermelisin.");
          return;
        }
      }

      const coordinates = (await Location.geocodeAsync(query)).slice(0, 5);
      if (!coordinates.length) {
        setSearchError("Bu arama için konum bulunamadı. Daha açık bir adres dene.");
        return;
      }

      const results = await Promise.all(
        coordinates.map(async (coordinate, index) => {
          const addresses = await Location.reverseGeocodeAsync(coordinate).catch(
            () => [],
          );
          return {
            id: `${coordinate.latitude}-${coordinate.longitude}-${index}`,
            label: formatSearchResult(addresses[0], query),
            latitude: coordinate.latitude,
            longitude: coordinate.longitude,
          };
        }),
      );
      setSearchResults(results);
    } catch {
      setSearchError("Konum aranamadı. Bağlantını kontrol edip tekrar dene.");
    } finally {
      setSearching(false);
    }
  }

  function chooseSearchResult(result: SearchResult) {
    const coordinate = {
      latitude: result.latitude,
      longitude: result.longitude,
    };
    setSelectedCoordinate(coordinate);
    setHasSelectedPoint(true);
    setSearchText(result.label);
    setSearchResults([]);
    setSearchError(null);
    mapRef.current?.animateToRegion(
      { ...coordinate, latitudeDelta: 0.006, longitudeDelta: 0.006 },
      450,
    );
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
          İşletme veya adres ara; sonucu seçtikten sonra işareti sürükleyerek
          noktayı hassaslaştırabilirsin.
        </AppText>
        <View
          style={[
            styles.searchShell,
            {
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
            },
          ]}
        >
          <SymbolView
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            size={20}
            tintColor={themeColors.textMuted}
          />
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            onChangeText={(value) => {
              setSearchText(value);
              setSearchError(null);
              if (!value.trim()) setSearchResults([]);
            }}
            onSubmitEditing={() => void searchLocation()}
            placeholder="İşletme, sokak veya adres ara"
            placeholderTextColor={themeColors.textMuted}
            returnKeyType="search"
            style={[styles.searchInput, { color: themeColors.text }]}
            value={searchText}
          />
          <Pressable
            accessibilityLabel="Konumu ara"
            disabled={isSearching}
            hitSlop={8}
            onPress={() => void searchLocation()}
            style={[
              styles.searchButton,
              { backgroundColor: themeColors.primary },
            ]}
          >
            {isSearching ? (
              <ActivityIndicator color={themeColors.onPrimary} size="small" />
            ) : (
              <AppText color="onPrimary" variant="label">
                Ara
              </AppText>
            )}
          </Pressable>
        </View>
        {searchError ? (
          <AppText color="danger" style={styles.searchMessage} variant="bodySmall">
            {searchError}
          </AppText>
        ) : null}
        {searchResults.length ? (
          <View
            style={[
              styles.results,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.border,
              },
            ]}
          >
            {searchResults.map((result, index) => (
              <Pressable
                key={result.id}
                onPress={() => chooseSearchResult(result)}
                style={[
                  styles.resultRow,
                  index > 0 && { borderTopColor: themeColors.border, borderTopWidth: 1 },
                ]}
              >
                <SymbolView
                  name={{ ios: "mappin", android: "location_on", web: "location_on" }}
                  size={18}
                  tintColor={themeColors.primary}
                />
                <AppText numberOfLines={2} style={styles.resultText} variant="bodySmall">
                  {result.label}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        <View style={[styles.mapShell, { borderColor: themeColors.border }]}>
          <MapView
            initialRegion={{
              ...initialCoordinate,
              latitudeDelta: 0.012,
              longitudeDelta: 0.012,
            }}
            onPress={selectFromMap}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            ref={mapRef}
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
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  searchShell: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, marginHorizontal: spacing.xs, minHeight: 48 },
  searchButton: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 36,
    minWidth: 58,
    paddingHorizontal: spacing.sm,
  },
  searchMessage: { marginBottom: spacing.xs, marginTop: spacing.xs },
  results: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
    overflow: "hidden",
  },
  resultRow: { alignItems: "center", flexDirection: "row", minHeight: 48, padding: spacing.sm },
  resultText: { flex: 1, marginLeft: spacing.xs },
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

function formatSearchResult(
  address: Location.LocationGeocodedAddress | undefined,
  fallback: string,
) {
  if (!address) return fallback;
  return [
    address.name,
    [address.street, address.streetNumber].filter(Boolean).join(" "),
    address.district,
    address.city,
    address.region,
  ]
    .filter((part, index, all) => Boolean(part) && all.indexOf(part) === index)
    .join(", ") || fallback;
}
