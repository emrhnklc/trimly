import { useState, type ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { AppButton } from "@/components/ui/AppButton";
import { AppText } from "@/components/ui/AppText";
import { radius, spacing } from "@/theme/spacing";
import { fontFamily } from "@/theme/typography";
import { useThemeColors } from "@/theme/useThemeColors";
import {
  dependentRelationshipLabels,
  type DependentProfileInput,
  type DependentRelationship,
} from "../types";
import { DependentBirthDatePicker } from "./DependentBirthDatePicker";

const relationships = Object.keys(
  dependentRelationshipLabels,
) as DependentRelationship[];

export function DependentProfileForm({
  error,
  footer,
  input,
  isSubmitting,
  onChange,
  onSubmit,
  submitLabel,
}: {
  error: string | null;
  footer?: ReactNode;
  input: DependentProfileInput;
  isSubmitting: boolean;
  onChange: (input: DependentProfileInput) => void;
  onSubmit: () => void;
  submitLabel: string;
}) {
  const colors = useThemeColors();
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      color: colors.text,
    },
  ];

  function update(nextInput: DependentProfileInput) {
    setValidationError(null);
    onChange(nextInput);
  }

  function submit() {
    const message = getValidationMessage(input);
    if (message) {
      setValidationError(message);
      return;
    }
    setValidationError(null);
    onSubmit();
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <AppText color="textMuted" style={styles.intro}>
        Yakın profili ayrı bir Trimly hesabı değildir. İletişim ve bildirimler
        sana gelir.
      </AppText>

      <FieldLabel text="Ad" />
      <TextInput
        autoCapitalize="words"
        onChangeText={(firstName) => update({ ...input, firstName })}
        placeholder="Örn. Ali"
        placeholderTextColor={colors.textMuted}
        style={inputStyle}
        value={input.firstName}
      />
      <FieldLabel text="Soyad" />
      <TextInput
        autoCapitalize="words"
        onChangeText={(lastName) => update({ ...input, lastName })}
        placeholder="Örn. Kaya"
        placeholderTextColor={colors.textMuted}
        style={inputStyle}
        value={input.lastName}
      />

      <FieldLabel text="Yakınlık" />
      <View style={styles.relationships}>
        {relationships.map((relationship) => {
          const selected = input.relationship === relationship;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              key={relationship}
              onPress={() =>
                update({
                  ...input,
                  relationship,
                  relationshipLabel:
                    relationship === "DEPENDENT" ? input.relationshipLabel : "",
                })
              }
              style={({ pressed }) => [
                styles.relationship,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <AppText color={selected ? "onPrimary" : "text"} variant="label">
                {dependentRelationshipLabels[relationship]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {input.relationship === "DEPENDENT" ? (
        <>
          <FieldLabel text="Yakınlık adı" />
          <TextInput
            autoCapitalize="sentences"
            maxLength={40}
            onChangeText={(relationshipLabel) =>
              update({ ...input, relationshipLabel })
            }
            placeholder="Örn. Kuzenim, yeğenim"
            placeholderTextColor={colors.textMuted}
            style={inputStyle}
            value={input.relationshipLabel ?? ""}
          />
        </>
      ) : null}

      <FieldLabel text="Doğum tarihi" />
      <DependentBirthDatePicker
        onChange={(birthDate) => update({ ...input, birthDate })}
        value={input.birthDate}
      />

      <FieldLabel text="Özel notlar (isteğe bağlı)" />
      <TextInput
        maxLength={500}
        multiline
        onChangeText={(notes) => update({ ...input, notes })}
        placeholder="Örn. Makine sesini sevmiyor, hassas saç derisi…"
        placeholderTextColor={colors.textMuted}
        style={[inputStyle, styles.notes]}
        textAlignVertical="top"
        value={input.notes ?? ""}
      />
      <AppText color="textMuted" style={styles.noteHint} variant="bodySmall">
        Bu notlar yalnızca senin Yakınlarım ekranında görünür.
      </AppText>

      {error || validationError ? (
        <View style={[styles.error, { backgroundColor: colors.dangerSurface }]}>
          <AppText color="danger" variant="bodySmall">
            {error ?? validationError}
          </AppText>
        </View>
      ) : null}

      <View style={styles.submit}>
        <AppButton disabled={isSubmitting} onPress={submit}>
          {isSubmitting ? "Kaydediliyor…" : submitLabel}
        </AppButton>
      </View>
      {footer}
    </ScrollView>
  );
}

function getValidationMessage(input: DependentProfileInput) {
  if (input.firstName.trim().length < 2)
    return "Ad en az 2 karakter olmalıdır.";
  if (input.lastName.trim().length < 2)
    return "Soyad en az 2 karakter olmalıdır.";
  if (
    input.relationship === "DEPENDENT" &&
    (input.relationshipLabel?.trim().length ?? 0) < 2
  ) {
    return "Diğer seçeneği için yakınlık adını yazmalısın.";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate))
    return "Doğum tarihini seçmelisin.";
  return null;
}

function FieldLabel({ text }: { text: string }) {
  return (
    <AppText style={styles.label} variant="label">
      {text}
    </AppText>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxxl, paddingHorizontal: spacing.lg },
  intro: { lineHeight: 21, marginBottom: spacing.sm },
  label: { marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    fontFamily: fontFamily.body,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  notes: { minHeight: 110 },
  noteHint: { marginTop: spacing.xs },
  relationships: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  relationship: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  error: {
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.sm,
  },
  submit: { marginTop: spacing.xl },
});
