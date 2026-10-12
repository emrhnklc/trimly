import { SymbolView } from 'expo-symbols';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type { BusinessCancellationResult } from '@/features/appointments/types';
import {
  cancellationPointReasonLabels,
  reliabilityActionLabels,
} from '@/features/business-management/reliability';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BusinessCancellationResultSheet({
  onClose,
  onOpenReliability,
  result,
}: {
  onClose: () => void;
  onOpenReliability: () => void;
  result: BusinessCancellationResult;
}) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const impact = result.reliabilityImpact;
  const penalized = impact.pointsAwarded > 0;

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel="İptal sonucunu kapat"
          accessibilityRole="button"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, spacing.lg),
            },
          ]}
        >
          <View
            style={[
              styles.iconShell,
              { backgroundColor: penalized ? colors.dangerSurface : colors.successSurface },
            ]}
          >
            <SymbolView
              name={{
                ios: penalized ? 'exclamationmark.triangle.fill' : 'checkmark.circle.fill',
                android: penalized ? 'warning' : 'check_circle',
                web: penalized ? 'warning' : 'check_circle',
              }}
              size={30}
              tintColor={penalized ? colors.danger : colors.success}
            />
          </View>

          <AppText style={styles.title} variant="sectionTitle">
            Randevu iptal edildi
          </AppText>
          <AppText color="textMuted" style={styles.description} variant="bodySmall">
            Müşteriye iptal nedeni gönderildi. Güvenilirlik etkisi aşağıda açıklandı.
          </AppText>

          <View
            style={[
              styles.scoreCard,
              {
                backgroundColor: colors.surface,
                borderColor: penalized ? colors.danger : colors.border,
              },
            ]}
          >
            <View>
              <AppText color="textMuted" variant="bodySmall">Bu iptalin puanı</AppText>
              <AppText color={penalized ? 'danger' : 'success'} style={styles.score} variant="displayMedium">
                +{impact.pointsAwarded}
              </AppText>
            </View>
            <View style={styles.totalBlock}>
              <AppText color="textMuted" variant="bodySmall">Son 90 gün</AppText>
              <AppText variant="heading">{impact.totalPoints90Days} puan</AppText>
            </View>
          </View>

          <View style={[styles.reasonCard, { backgroundColor: colors.surfaceMuted }]}>
            <AppText variant="label">Puanın nedeni</AppText>
            <AppText color="textMuted" variant="bodySmall">
              {cancellationPointReasonLabels[impact.pointReason]}
            </AppText>
          </View>

          {impact.triggeredActions.length > 0 ? (
            <View style={styles.actionList}>
              <AppText color="danger" variant="label">Yeni uygulanan sonuç</AppText>
              {impact.triggeredActions.map((action) => (
                <View key={action} style={styles.actionRow}>
                  <View style={[styles.dot, { backgroundColor: colors.danger }]} />
                  <AppText color="textMuted" style={styles.actionCopy} variant="bodySmall">
                    {reliabilityActionLabels[action]}
                  </AppText>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.buttons}>
            <AppButton onPress={onOpenReliability}>Güvenilirliği Gör</AppButton>
            <AppButton onPress={onClose} variant="secondary">Tamam</AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(18, 14, 11, 0.64)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    borderRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconShell: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  title: { marginTop: spacing.md, textAlign: 'center' },
  description: { lineHeight: 20, marginTop: spacing.xs, textAlign: 'center' },
  scoreCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  score: { fontSize: 34, lineHeight: 40, marginTop: spacing.xxs },
  totalBlock: { alignItems: 'flex-end', gap: spacing.xxs },
  reasonCard: { borderRadius: radius.smallCard, gap: spacing.xxs, marginTop: spacing.sm, padding: spacing.md },
  actionList: { gap: spacing.xs, marginTop: spacing.md },
  actionRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.xs },
  dot: { borderRadius: radius.pill, height: 7, marginTop: 6, width: 7 },
  actionCopy: { flex: 1 },
  buttons: { gap: spacing.xs, marginTop: spacing.lg },
});
