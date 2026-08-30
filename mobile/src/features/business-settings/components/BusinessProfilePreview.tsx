import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

function isImageUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

export function BusinessProfilePreview({
  address,
  coverImageUrl,
  isDiscoverable,
  name,
  profileImageUrl,
}: {
  address: string;
  coverImageUrl: string;
  isDiscoverable: boolean;
  name: string;
  profileImageUrl: string;
}) {
  const initial = name.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <View style={styles.card}>
      <View style={styles.cover}>
        {isImageUrl(coverImageUrl) ? (
          <Image contentFit="cover" source={coverImageUrl.trim()} style={styles.fill} />
        ) : (
          <View style={[styles.fill, styles.coverPlaceholder]}>
            <SymbolView
              name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
              size={45}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.fill, styles.overlay]} />
      </View>

      <View style={styles.summary}>
        <View style={styles.avatarFrame}>
          {isImageUrl(profileImageUrl) ? (
            <Image contentFit="cover" source={profileImageUrl.trim()} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <AppText color="primary" style={styles.initial} variant="heading">{initial}</AppText>
            </View>
          )}
        </View>
        <View style={styles.copy}>
          <AppText numberOfLines={1} style={styles.name} variant="heading">
            {name.trim() || 'İşletme adı'}
          </AppText>
          <AppText color="textMuted" numberOfLines={1} variant="bodySmall">
            {address.trim() || 'Adres bilgisi bekleniyor'}
          </AppText>
        </View>
        <View style={[styles.badge, !isDiscoverable && styles.hiddenBadge]}>
          <AppText color={isDiscoverable ? 'primary' : 'textMuted'} variant="bodySmall">
            {isDiscoverable ? 'Keşfette' : 'Gizli'}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.md },
  cover: {
    backgroundColor: colors.darkSurface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    height: 156,
    overflow: 'hidden',
  },
  fill: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  coverPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  overlay: { backgroundColor: 'rgba(24, 18, 14, 0.2)' },
  summary: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    borderColor: colors.border,
    borderTopWidth: 0,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 94,
    paddingLeft: 104,
    paddingRight: spacing.sm,
  },
  avatarFrame: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 82,
    left: spacing.md,
    padding: 4,
    position: 'absolute',
    top: -28,
    width: 82,
  },
  avatar: { borderRadius: radius.pill, height: '100%', width: '100%' },
  avatarPlaceholder: { alignItems: 'center', backgroundColor: colors.surfaceMuted, justifyContent: 'center' },
  initial: { fontSize: 28, lineHeight: 34 },
  copy: { flex: 1, paddingRight: spacing.xs },
  name: { fontSize: 17, lineHeight: 23 },
  badge: {
    backgroundColor: '#FBF3DE',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hiddenBadge: { backgroundColor: colors.background },
});
