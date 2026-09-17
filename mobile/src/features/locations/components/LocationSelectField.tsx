import { SymbolView } from "expo-symbols";
import { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export type LocationOption = { label: string; value: string };

export function LocationSelectField({
  disabled = false,
  label,
  loading = false,
  onChange,
  options,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  loading?: boolean;
  onChange: (option: LocationOption) => void;
  options: LocationOption[];
  placeholder: string;
  value: LocationOption | null;
}) {
  const colors = useThemeColors();
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLocaleLowerCase("tr-TR").includes(normalized),
    );
  }, [options, query]);

  function close() {
    setOpen(false);
    setQuery("");
  }

  return (
    <View style={styles.field}>
      <AppText variant="label">{label}</AppText>
      <Pressable
        accessibilityRole="button"
        disabled={disabled || loading}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          styles.select,
          { backgroundColor: colors.background, borderColor: colors.border },
          disabled && styles.disabled,
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{ ios: "mappin", android: "location_on", web: "location_on" }}
          size={18}
          tintColor={disabled ? colors.textMuted : colors.primary}
        />
        <AppText
          color={value ? "text" : "textMuted"}
          numberOfLines={1}
          style={styles.selectValue}
        >
          {loading ? "Yükleniyor…" : value?.label ?? placeholder}
        </AppText>
        <SymbolView
          name={{ ios: "chevron.down", android: "expand_more", web: "expand_more" }}
          size={17}
          tintColor={colors.textMuted}
        />
      </Pressable>

      <Modal animationType="slide" onRequestClose={close} visible={isOpen}>
        <SafeAreaView style={[styles.modal, { backgroundColor: colors.background }]}> 
          <View style={styles.modalHeader}>
            <Pressable accessibilityRole="button" hitSlop={10} onPress={close}>
              <AppText color="primary" variant="label">Kapat</AppText>
            </Pressable>
            <AppText variant="sectionTitle">{label} Seç</AppText>
            <View style={styles.headerSpacer} />
          </View>
          <View
            style={[
              styles.search,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <SymbolView
              name={{ ios: "magnifyingglass", android: "search", web: "search" }}
              size={18}
              tintColor={colors.textMuted}
            />
            <TextInput
              autoFocus
              onChangeText={setQuery}
              placeholder={`${label} ara`}
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={[styles.searchInput, { color: colors.text }]}
              value={query}
            />
          </View>
          <FlatList
            contentContainerStyle={styles.list}
            data={filteredOptions}
            keyboardShouldPersistTaps="handled"
            keyExtractor={(option) => option.value}
            ListEmptyComponent={
              <AppText color="textMuted" style={styles.empty}>Sonuç bulunamadı.</AppText>
            }
            renderItem={({ item }) => {
              const selected = item.value === value?.value;
              return (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    onChange(item);
                    close();
                  }}
                  style={({ pressed }) => [
                    styles.option,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <AppText style={styles.optionLabel}>{item.label}</AppText>
                  {selected ? (
                    <SymbolView
                      name={{ ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" }}
                      size={21}
                      tintColor={colors.primary}
                    />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  select: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 50,
    paddingHorizontal: spacing.md,
  },
  selectValue: { flex: 1, marginHorizontal: spacing.sm },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.68 },
  modal: { flex: 1, paddingHorizontal: spacing.lg },
  modalHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
  },
  headerSpacer: { width: 38 },
  search: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
  },
  list: { gap: spacing.xs, paddingBottom: spacing.xl, paddingTop: spacing.md },
  option: {
    alignItems: "center",
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  optionLabel: { flex: 1 },
  empty: { paddingTop: spacing.xl, textAlign: "center" },
});
