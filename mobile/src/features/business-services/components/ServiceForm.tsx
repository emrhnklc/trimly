import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { fontFamily } from '@/theme/typography';

const durationOptions = [15, 20, 30, 45, 60];

export type ServiceFormValues = {
  description: string;
  durationMinutes: number;
  isActive: boolean;
  name: string;
  price: string;
};

export function ServiceForm({
  error,
  initialValues,
  isSubmitting,
  onSubmit,
  showActiveStatus = false,
  submitLabel,
}: {
  error?: string | null;
  initialValues?: ServiceFormValues;
  isSubmitting: boolean;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  showActiveStatus?: boolean;
  submitLabel: string;
}) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [duration, setDuration] = useState(String(initialValues?.durationMinutes ?? 30));
  const [price, setPrice] = useState(initialValues?.price ?? '');
  const [isActive, setActive] = useState(initialValues?.isActive ?? true);
  const [validationError, setValidationError] = useState<string | null>(null);

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const durationMinutes = Number(duration);
    const normalizedPrice = price.trim().replace(',', '.');

    if (!trimmedName) {
      setValidationError('Hizmet adı boş bırakılamaz.');
      return;
    }
    if (trimmedName.length > 100) {
      setValidationError('Hizmet adı en fazla 100 karakter olabilir.');
      return;
    }
    if (trimmedDescription.length > 500) {
      setValidationError('Açıklama en fazla 500 karakter olabilir.');
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 5) {
      setValidationError('Hizmet süresi en az 5 dakika ve tam sayı olmalı.');
      return;
    }
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice)) {
      setValidationError('Geçerli bir fiyat yazmalısın. Örnek: 450 veya 450,50');
      return;
    }

    setValidationError(null);
    await onSubmit({
      description: trimmedDescription,
      durationMinutes,
      isActive,
      name: trimmedName,
      price: normalizedPrice,
    });
  }

  return (
    <View>
      <View style={styles.formCard}>
        <FormField label="Hizmet adı" required>
          <TextInput
            autoCapitalize="words"
            autoCorrect={false}
            editable={!isSubmitting}
            maxLength={100}
            onChangeText={setName}
            placeholder="Örn. Saç Kesimi"
            placeholderTextColor={colors.textMuted}
            returnKeyType="next"
            style={styles.input}
            value={name}
          />
        </FormField>

        <FormField label="Açıklama">
          <TextInput
            editable={!isSubmitting}
            maxLength={500}
            multiline
            onChangeText={setDescription}
            placeholder="Hizmetle ilgili kısa bir açıklama"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.multilineInput]}
            textAlignVertical="top"
            value={description}
          />
          <AppText color="textMuted" style={styles.characterCount} variant="bodySmall">
            {description.length}/500
          </AppText>
        </FormField>

        <FormField label="Süre" required>
          <View style={styles.durationOptions}>
            {durationOptions.map((option) => {
              const selected = duration === String(option);
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  disabled={isSubmitting}
                  key={option}
                  onPress={() => setDuration(String(option))}
                  style={({ pressed }) => [
                    styles.durationOption,
                    selected && styles.selectedDuration,
                    pressed && styles.pressed,
                  ]}>
                  <AppText
                    color={selected ? 'onPrimary' : 'text'}
                    style={styles.durationLabel}
                    variant="label">
                    {option} dk
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.customDurationRow}>
            <AppText color="textMuted" variant="bodySmall">Farklı süre:</AppText>
            <TextInput
              editable={!isSubmitting}
              keyboardType="number-pad"
              maxLength={3}
              onChangeText={setDuration}
              style={styles.durationInput}
              value={duration}
            />
            <AppText color="textMuted" variant="bodySmall">dakika</AppText>
          </View>
        </FormField>

        <FormField label="Fiyat" required>
          <View style={styles.priceField}>
            <AppText color="primary" style={styles.currency} variant="heading">₺</AppText>
            <TextInput
              editable={!isSubmitting}
              keyboardType="decimal-pad"
              maxLength={12}
              onChangeText={setPrice}
              placeholder="450"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.priceInput]}
              value={price}
            />
          </View>
        </FormField>

        {showActiveStatus ? (
          <View style={styles.statusRow}>
            <View style={styles.statusContent}>
              <AppText variant="label">Randevuya açık</AppText>
              <AppText color="textMuted" style={styles.statusDescription} variant="bodySmall">
                Pasif hizmetler müşterilere gösterilmez, geçmiş randevular korunur.
              </AppText>
            </View>
            <Switch
              disabled={isSubmitting}
              onValueChange={setActive}
              trackColor={{ false: colors.border, true: '#D7B96F' }}
              thumbColor={isActive ? colors.primary : colors.surface}
              value={isActive}
            />
          </View>
        ) : null}
      </View>

      {validationError || error ? (
        <View style={styles.errorBox}>
          <AppText color="danger" style={styles.errorText} variant="bodySmall">
            {validationError ?? error}
          </AppText>
        </View>
      ) : null}

      <View style={styles.submit}>
        <AppButton disabled={isSubmitting} onPress={() => void handleSubmit()}>
          {isSubmitting ? 'Kaydediliyor...' : submitLabel}
        </AppButton>
      </View>
    </View>
  );
}

function FormField({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <AppText style={styles.fieldLabel} variant="label">
        {label}{required ? ' *' : ''}
      </AppText>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: spacing.md,
  },
  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, lineHeight: 18, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.smallCard,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamily.body,
    fontSize: 14,
    minHeight: 50,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  multilineInput: { minHeight: 92 },
  characterCount: { fontSize: 9, lineHeight: 12, marginTop: 4, textAlign: 'right' },
  durationOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  durationOption: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    minHeight: 38,
    minWidth: 58,
    paddingHorizontal: 9,
    justifyContent: 'center',
  },
  selectedDuration: { backgroundColor: colors.darkSurface, borderColor: colors.darkSurface },
  durationLabel: { fontSize: 10, lineHeight: 14 },
  customDurationRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  durationInput: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    height: 38,
    paddingHorizontal: spacing.sm,
    textAlign: 'center',
    width: 64,
  },
  priceField: { alignItems: 'center', flexDirection: 'row' },
  currency: { marginRight: spacing.sm },
  priceInput: { flex: 1 },
  statusRow: { alignItems: 'center', flexDirection: 'row', marginBottom: spacing.xxs },
  statusContent: { flex: 1, marginRight: spacing.md },
  statusDescription: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  errorBox: {
    backgroundColor: '#F8E8E5',
    borderRadius: radius.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
  },
  errorText: { textAlign: 'center' },
  submit: { marginTop: spacing.md },
  pressed: { opacity: 0.7 },
});
