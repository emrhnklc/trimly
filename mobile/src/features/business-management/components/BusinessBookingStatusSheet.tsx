import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type {
  BarbershopReadiness,
  BarbershopReadinessRequirement,
} from '@/features/barbershops/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessBookingStatusSheet({
  error,
  isUpdating,
  onClose,
  onFixRequirement,
  onSetBookingAcceptance,
  readiness,
  visible,
}: {
  error: string | null;
  isUpdating: boolean;
  onClose: () => void;
  onFixRequirement: (requirement: BarbershopReadinessRequirement) => void;
  onSetBookingAcceptance: (acceptsBookings: boolean) => void;
  readiness: BarbershopReadiness;
  visible: boolean;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const isOpen = readiness.isBookingOpen;
  const isReady = readiness.isReadyToPublish;

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}>
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="Randevu durumunu kapat"
          accessibilityRole="button"
          disabled={isUpdating}
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.titleRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOpen ? colors.success : colors.primary },
              ]}
            />
            <AppText variant="sectionTitle">
              {isOpen ? 'Randevuya açık' : 'Randevu alımı kapalı'}
            </AppText>
          </View>
          <AppText color="textMuted" style={styles.description} variant="body">
            {isOpen
              ? 'Müşteriler uygun saatlerinden yeni randevu alabilir.'
              : readiness.missingRequirements.length
                ? 'Aşağıdaki eksikleri tamamlayınca randevu alımı yeniden açılabilir.'
                : 'İşletmen keşfette görünür; mevcut randevular etkilenmez.'}
          </AppText>

          {readiness.missingRequirements.length ? (
            <View style={styles.requirements}>
              {readiness.missingRequirements.map((requirement) => (
                <Pressable
                  accessibilityRole="button"
                  key={requirement.code}
                  onPress={() => onFixRequirement(requirement.code)}
                  style={({ pressed }) => [
                    styles.requirement,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    pressed && styles.pressed,
                  ]}>
                  <AppText style={styles.requirementMark} color="primary" variant="label">
                    ○
                  </AppText>
                  <AppText style={styles.requirementText} variant="bodySmall">
                    {requirement.label}
                  </AppText>
                  <AppText color="primary" variant="label">Düzelt</AppText>
                </Pressable>
              ))}
            </View>
          ) : null}

          {error ? (
            <AppText color="danger" style={styles.error} variant="bodySmall">
              {error}
            </AppText>
          ) : null}

          <View style={styles.actions}>
            {isOpen ? (
              <AppButton
                disabled={isUpdating}
                onPress={() => onSetBookingAcceptance(false)}
                variant="secondary">
                {isUpdating ? 'Güncelleniyor…' : 'Yeni Randevuları Durdur'}
              </AppButton>
            ) : isReady && !readiness.acceptsBookings ? (
              <AppButton
                disabled={isUpdating}
                onPress={() => onSetBookingAcceptance(true)}>
                {isUpdating ? 'Açılıyor…' : 'Randevuları Aç'}
              </AppButton>
            ) : readiness.acceptsBookings ? (
              <AppButton
                disabled={isUpdating}
                onPress={() => onSetBookingAcceptance(false)}
                variant="secondary">
                Düzeltilince Otomatik Açılmasın
              </AppButton>
            ) : null}
            <AppButton disabled={isUpdating} onPress={onClose} variant="ghost">
              Kapat
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(18, 14, 11, 0.52)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.lg,
    width: 44,
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  statusDot: { borderRadius: radius.pill, height: 11, width: 11 },
  description: { lineHeight: 22, marginTop: spacing.xs },
  requirements: { gap: spacing.xs, marginTop: spacing.lg },
  requirement: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.sm,
  },
  requirementMark: { marginRight: spacing.xs },
  requirementText: { flex: 1 },
  error: { lineHeight: 18, marginTop: spacing.sm },
  actions: { gap: spacing.xs, marginTop: spacing.lg },
  pressed: { opacity: 0.72 },
});
