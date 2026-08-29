import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessMembership } from '@/features/auth/types';
import { businessRoleLabels } from '@/features/business/role-labels';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BusinessMembershipCardProps = {
  isSelected: boolean;
  membership: BusinessMembership;
  onPress: () => void;
};

export function BusinessMembershipCard({
  isSelected,
  membership,
  onPress,
}: BusinessMembershipCardProps) {
  const { barbershop } = membership;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.selectedCard,
        pressed && styles.pressed,
      ]}>
      {barbershop.profileImageUrl ? (
        <Image contentFit="cover" source={barbershop.profileImageUrl} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <SymbolView
            name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            size={24}
            tintColor={colors.primary}
          />
        </View>
      )}

      <View style={styles.details}>
        <AppText numberOfLines={1} style={styles.name} variant="label">
          {barbershop.name}
        </AppText>
        <AppText color="textMuted" style={styles.role} variant="bodySmall">
          {businessRoleLabels[membership.role]}
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.slug} variant="bodySmall">
          trimly.app/{barbershop.slug}
        </AppText>
      </View>

      <View style={[styles.radio, isSelected && styles.selectedRadio]}>
        {isSelected ? (
          <SymbolView
            name={{ ios: 'checkmark', android: 'check', web: 'check' }}
            size={15}
            tintColor={colors.onPrimary}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 94,
    padding: spacing.md,
  },
  selectedCard: { backgroundColor: '#FCF5E6', borderColor: colors.primary, borderWidth: 1.5 },
  pressed: { opacity: 0.72 },
  image: { borderRadius: radius.md, height: 58, width: 58 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  details: { flex: 1, marginHorizontal: spacing.md },
  name: { fontSize: 15, lineHeight: 20 },
  role: { color: colors.primary, marginTop: spacing.xxs },
  slug: { fontSize: 11, lineHeight: 15, marginTop: 2 },
  radio: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  selectedRadio: { backgroundColor: colors.primary, borderColor: colors.primary },
});
