import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';
import { MemberRoleSelector, type AssignableBusinessRole } from './MemberRoleSelector';

const expiryOptions = [
  { hours: 24, label: '24 saat' },
  { hours: 72, label: '3 gün' },
  { hours: 168, label: '7 gün' },
];

export function InvitationForm({
  error,
  isSubmitting,
  onSubmit,
}: {
  error?: string | null;
  isSubmitting: boolean;
  onSubmit: (role: AssignableBusinessRole, expiresInHours: number) => Promise<void>;
}) {
  const themeColors = useThemeColors();
  const [role, setRole] = useState<AssignableBusinessRole>('BARBER');
  const [expiresInHours, setExpiresInHours] = useState(24);

  return (
    <View>
      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <AppText style={styles.sectionTitle} variant="label">Çalışan rolü</AppText>
        <AppText color="textMuted" style={styles.description} variant="bodySmall">
          Rol bağlantının içine güvenli biçimde kaydedilir; davet edilen kişi rol seçemez.
        </AppText>
        <View style={styles.roles}>
          <MemberRoleSelector disabled={isSubmitting} onChange={setRole} value={role} />
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <AppText style={styles.sectionTitle} variant="label">Bağlantı geçerlilik süresi</AppText>
        <View style={styles.expiryRow}>
          {expiryOptions.map((option) => {
            const selected = expiresInHours === option.hours;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                disabled={isSubmitting}
                key={option.hours}
                onPress={() => setExpiresInHours(option.hours)}
                style={({ pressed }) => [
                  styles.expiryOption,
                  { backgroundColor: themeColors.background, borderColor: themeColors.border },
                  selected && [styles.selectedExpiry, { backgroundColor: themeColors.darkSurface, borderColor: themeColors.darkSurface }],
                  pressed && styles.pressed,
                ]}>
                <AppText color={selected ? 'onPrimary' : 'text'} style={styles.expiryLabel} variant="label">
                  {option.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <View style={[styles.errorBox, { backgroundColor: themeColors.dangerSurface }]}>
          <AppText color="danger" style={styles.errorText} variant="bodySmall">{error}</AppText>
        </View>
      ) : null}

      <View style={styles.submit}>
        <AppButton disabled={isSubmitting} onPress={() => void onSubmit(role, expiresInHours)}>
          {isSubmitting ? 'Davet hazırlanıyor...' : 'Davet Bağlantısı Oluştur'}
        </AppButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  sectionTitle: { fontSize: 13, lineHeight: 18 },
  description: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  roles: { marginTop: spacing.sm },
  expiryRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  expiryOption: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
    minHeight: 42,
  },
  selectedExpiry: {},
  expiryLabel: { fontSize: 10, lineHeight: 14 },
  errorBox: { borderRadius: radius.sm, padding: spacing.sm },
  errorText: { textAlign: 'center' },
  submit: { marginTop: spacing.md },
  pressed: { opacity: 0.68 },
});
