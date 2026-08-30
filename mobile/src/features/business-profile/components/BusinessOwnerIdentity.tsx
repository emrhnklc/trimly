import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AuthUser, BusinessMembership } from '@/features/auth/types';
import { businessRoleLabels } from '@/features/business/role-labels';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessOwnerIdentity({
  membership,
  onPress,
  user,
}: {
  membership: BusinessMembership;
  onPress: () => void;
  user: AuthUser;
}) {
  const initial = user.firstName.slice(0, 1).toLocaleUpperCase('tr-TR');

  return (
    <Pressable
      accessibilityLabel="Hesap bilgilerini aç"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      {user.profileImageUrl ? (
        <Image
          accessibilityLabel={`${user.firstName} profil fotoğrafı`}
          contentFit="cover"
          source={user.profileImageUrl}
          style={styles.avatar}
          transition={180}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText color="primary" style={styles.initial} variant="displayMedium">{initial}</AppText>
        </View>
      )}

      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <AppText numberOfLines={1} style={styles.name} variant="heading">
            {user.firstName} {user.lastName}
          </AppText>
          <View style={styles.roleBadge}>
            <AppText color="primary" style={styles.roleText} variant="overline">
              {businessRoleLabels[membership.role]}
            </AppText>
          </View>
        </View>
        <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
          {user.email}
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.shopName} variant="bodySmall">
          {membership.barbershop.name}
        </AppText>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={18}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 92,
    padding: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 66, width: 66 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  initial: { fontSize: 28, lineHeight: 34 },
  copy: { flex: 1, marginHorizontal: spacing.md },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  name: { flexShrink: 1, fontSize: 18, lineHeight: 24 },
  roleBadge: {
    backgroundColor: '#FBF3DE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  roleText: { fontSize: 7, lineHeight: 10 },
  shopName: { marginTop: 2 },
  pressed: { opacity: 0.68 },
});
