import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AuthUser } from '@/features/auth/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ProfileMenuIdentity({ onPress, user }: { onPress: () => void; user: AuthUser }) {
  const initial = user.firstName.slice(0, 1).toUpperCase();

  return (
    <Pressable
      accessibilityLabel="Profili görüntüle ve düzenle"
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

      <View style={styles.details}>
        <View style={styles.nameRow}>
          <AppText numberOfLines={1} style={styles.name} variant="heading">
            {user.firstName} {user.lastName}
          </AppText>
          <View style={styles.memberBadge}>
            <AppText color="primary" style={styles.memberBadgeText} variant="overline">ÜYE</AppText>
          </View>
        </View>
        <AppText color="textMuted" numberOfLines={1} style={styles.description} variant="bodySmall">
          Profilini görüntüle ve düzenle
        </AppText>
      </View>

      <SymbolView
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={19}
        tintColor={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 84,
    paddingVertical: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 66, width: 66 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  initial: { fontSize: 27, lineHeight: 32 },
  details: { flex: 1, marginHorizontal: spacing.sm },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  name: { flexShrink: 1, fontSize: 17, lineHeight: 22 },
  memberBadge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  memberBadgeText: { fontSize: 8, lineHeight: 10 },
  description: { fontSize: 11, lineHeight: 15, marginTop: spacing.xxs },
  pressed: { opacity: 0.68 },
});
