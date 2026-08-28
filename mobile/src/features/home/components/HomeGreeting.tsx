import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { AuthUser } from '@/features/auth/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function HomeGreeting({ user }: { user: AuthUser }) {
  const initial = user.firstName.slice(0, 1).toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <AppText style={styles.title} variant="displayMedium">Selam, {user.firstName}</AppText>
        <AppText color="textMuted" style={styles.subtitle}>
          Bugün nasıl bir stil istersin?
        </AppText>
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  copy: { flex: 1, paddingRight: spacing.md },
  title: { fontSize: 24, lineHeight: 29 },
  subtitle: { marginTop: spacing.xxs },
  avatar: { borderRadius: radius.pill, height: 64, width: 64 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    justifyContent: 'center',
  },
  initial: { fontSize: 27, lineHeight: 31 },
});
