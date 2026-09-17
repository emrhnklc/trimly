import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { formatTurkishPrice } from '@/features/business-management/format';
import type { ManagementService } from '@/features/business-management/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function ManagementServiceCard({
  onPress,
  service,
}: {
  onPress: () => void;
  service: ManagementService;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !service.isActive && styles.inactive,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconShell, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView
          name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
          size={20}
          tintColor={service.isActive ? colors.primary : colors.textMuted}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <AppText numberOfLines={1} style={styles.name} variant="label">{service.name}</AppText>
          <View style={[
            styles.statusBadge,
            { backgroundColor: service.isActive ? colors.successSurface : colors.surfaceMuted },
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: service.isActive ? colors.success : colors.textMuted },
            ]} />
            <AppText
              color={service.isActive ? 'success' : 'textMuted'}
              style={styles.statusLabel}
              variant="label">
              {service.isActive ? 'Aktif' : 'Pasif'}
            </AppText>
          </View>
        </View>
        {service.description ? (
          <AppText color="textMuted" numberOfLines={1} style={styles.description} variant="bodySmall">
            {service.description}
          </AppText>
        ) : null}
        <View style={styles.metaRow}>
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            {service.durationMinutes} dk
          </AppText>
          <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
          <AppText color="primary" style={styles.price} variant="label">
            {formatTurkishPrice(service.price)}
          </AppText>
        </View>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 88,
    padding: spacing.sm,
  },
  inactive: { opacity: 0.72 },
  pressed: { opacity: 0.68 },
  iconShell: {
    alignItems: 'center',
    borderRadius: radius.smallCard,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  content: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
  titleRow: { alignItems: 'center', flexDirection: 'row' },
  name: { flex: 1, fontSize: 16, lineHeight: 21, minWidth: 0 },
  statusBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    marginLeft: spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  statusDot: { borderRadius: radius.pill, height: 5, width: 5 },
  statusLabel: { fontSize: 8, lineHeight: 11 },
  description: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  metaRow: { alignItems: 'center', flexDirection: 'row', marginTop: 5 },
  meta: { fontSize: 10, lineHeight: 14 },
  metaDot: {
    borderRadius: radius.pill,
    height: 3,
    marginHorizontal: 6,
    width: 3,
  },
  price: { fontSize: 11, lineHeight: 15 },
});
