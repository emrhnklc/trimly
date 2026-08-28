import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { AuthUser } from '@/features/auth/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ProfileIdentity({
  onEditPress,
  user,
}: {
  onEditPress: () => void;
  user: AuthUser;
}) {
  const initial = user.firstName.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.avatarArea}>
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
            <AppText color="primary" style={styles.initial} variant="displayLarge">{initial}</AppText>
          </View>
        )}
        <Pressable
          accessibilityLabel="Profili düzenle"
          accessibilityRole="button"
          onPress={onEditPress}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
          <SymbolView
            name={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            size={16}
            tintColor={colors.onPrimary}
          />
        </Pressable>
      </View>

      <View style={styles.details}>
        <AppText numberOfLines={1} style={styles.name} variant="displayMedium">
          {user.firstName} {user.lastName}
        </AppText>
        <AppText color="primary" style={styles.memberLabel} variant="label">
          Trimly Üyesi
        </AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.contact} variant="bodySmall">
          {user.email}
        </AppText>
        <AppText color="textMuted" style={styles.contact} variant="bodySmall">
          {user.phone || 'Telefon eklenmedi'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.lg },
  avatarArea: { height: 112, width: 112 },
  avatar: { borderRadius: radius.pill, height: 108, width: 108 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  initial: { fontSize: 40, lineHeight: 46 },
  editButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 3,
    bottom: 0,
    height: 38,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 38,
  },
  pressed: { opacity: 0.72 },
  details: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: 25, lineHeight: 30 },
  memberLabel: { marginTop: spacing.xxs },
  contact: { marginTop: 2 },
});
