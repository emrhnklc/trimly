import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

const today = new Date();
const earliestDate = new Date(
  today.getFullYear() - 120,
  today.getMonth(),
  today.getDate(),
);

export function DependentBirthDatePicker({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  const colors = useThemeColors();
  const [draftDate, setDraftDate] = useState(() => dateKeyToDate(value));
  const [isVisible, setVisible] = useState(false);

  function open() {
    setDraftDate(dateKeyToDate(value));
    setVisible(true);
  }

  function changeAndroidDate(event: DateTimePickerEvent, selected?: Date) {
    setVisible(false);
    if (event.type === "set" && selected) onChange(dateToKey(selected));
  }

  return (
    <>
      <Pressable
        accessibilityLabel="Doğum tarihi seç"
        accessibilityRole="button"
        onPress={open}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <SymbolView
          name={{
            ios: "calendar",
            android: "calendar_month",
            web: "calendar_month",
          }}
          size={19}
          tintColor={colors.primary}
        />
        <AppText color={value ? "text" : "textMuted"} style={styles.value}>
          {value ? formatDateKey(value) : "Tarih seç"}
        </AppText>
        <SymbolView
          name={{
            ios: "chevron.down",
            android: "keyboard_arrow_down",
            web: "keyboard_arrow_down",
          }}
          size={18}
          tintColor={colors.textMuted}
        />
      </Pressable>

      {Platform.OS === "android" && isVisible ? (
        <DateTimePicker
          display="default"
          maximumDate={today}
          minimumDate={earliestDate}
          mode="date"
          onChange={changeAndroidDate}
          value={draftDate}
        />
      ) : null}

      <Modal
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        transparent
        visible={Platform.OS === "ios" && isVisible}
      >
        <Pressable onPress={() => setVisible(false)} style={styles.overlay}>
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText style={styles.title} variant="sectionTitle">
              Doğum tarihi
            </AppText>
            <DateTimePicker
              display="spinner"
              locale="tr-TR"
              maximumDate={today}
              minimumDate={earliestDate}
              mode="date"
              onChange={(_, selected) => selected && setDraftDate(selected)}
              value={draftDate}
            />
            <View style={styles.actions}>
              <View style={styles.action}>
                <AppButton
                  onPress={() => setVisible(false)}
                  variant="secondary"
                >
                  Vazgeç
                </AppButton>
              </View>
              <View style={styles.action}>
                <AppButton
                  onPress={() => {
                    onChange(dateToKey(draftDate));
                    setVisible(false);
                  }}
                >
                  Tarihi Kullan
                </AppButton>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function dateKeyToDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (year && month && day) return new Date(year, month - 1, day, 12);
  const defaultDate = new Date();
  defaultDate.setFullYear(defaultDate.getFullYear() - 10);
  defaultDate.setHours(12, 0, 0, 0);
  return defaultDate;
}

function dateToKey(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateKey(value: string) {
  const date = dateKeyToDate(value);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

const styles = StyleSheet.create({
  field: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  value: { flex: 1, marginHorizontal: spacing.sm },
  pressed: { opacity: 0.7 },
  overlay: {
    backgroundColor: "rgba(12, 8, 5, 0.58)",
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  card: { borderRadius: radius.card, borderWidth: 1, padding: spacing.lg },
  title: { textAlign: "center" },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1 },
});
