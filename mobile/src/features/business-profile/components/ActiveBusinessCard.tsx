import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ActiveBusinessCard({
  address,
  isDiscoverable,
  name,
  onPress,
  profileImageUrl,
}: {
  address?: string | null;
  isDiscoverable?: boolean;
  name: string;
  onPress: () => void;
  profileImageUrl?: string | null;
}) {
  const initial = name.slice(0, 1).toLocaleUpperCase('tr-TR');

  return (
    <Pressable
      accessibilityLabel="Aktif işletme bilgilerini düzenle"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {profileImageUrl ? (
        <Image contentFit="cover" source={profileImageUrl} style={styles.logo} transition={180} />
      ) : (
        <View style={[styles.logo, styles.logoPlaceholder]}>
          <AppText color="primary" style={styles.initial} variant="heading">{initial}</AppText>
        </View>
      )}

      <View style={styles.copy}>
        <View style={styles.overlineRow}>
          <AppText color="primary" style={styles.overline} variant="overline">AKTİF İŞLETME</AppText>
          {typeof isDiscoverable === 'boolean' ? (
            <View style={[styles.visibilityBadge, !isDiscoverable && styles.hiddenBadge]}>
              <View style={[styles.dot, !isDiscoverable && styles.hiddenDot]} />
              <AppText color={isDiscoverable ? 'primary' : 'textMuted'} style={styles.visibilityText} variant="overline">
                {isDiscoverable ? 'YAYINDA' : 'GİZLİ'}
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText numberOfLines={1} style={styles.name} variant="heading">{name}</AppText>
        <View style={styles.addressRow}>
          <SymbolView
            name={{ ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' }}
            size={14}
            tintColor={colors.textMuted}
          />
          <AppText color="textMuted" numberOfLines={1} style={styles.address} variant="bodySmall">
            {address || 'Adres bilgisini tamamla'}
          </AppText>
        </View>
      </View>

      <View style={styles.chevron}>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={17}
          tintColor={colors.textMuted}
        />
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
    minHeight: 96,
    padding: spacing.sm,
  },
  logo: { borderRadius: radius.md, height: 68, width: 68 },
  logoPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initial: { fontSize: 24, lineHeight: 30 },
  copy: { flex: 1, marginLeft: spacing.md },
  overlineRow: { alignItems: 'center', flexDirection: 'row' },
  overline: { fontSize: 8, lineHeight: 11 },
  visibilityBadge: {
    alignItems: 'center',
    backgroundColor: '#FBF3DE',
    borderRadius: radius.pill,
    flexDirection: 'row',
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
  },
  hiddenBadge: { backgroundColor: colors.background },
  dot: { backgroundColor: colors.primary, borderRadius: radius.pill, height: 5, marginRight: 4, width: 5 },
  hiddenDot: { backgroundColor: colors.textMuted },
  visibilityText: { fontSize: 7, lineHeight: 9 },
  name: { fontSize: 16, lineHeight: 22, marginTop: 3 },
  addressRow: { alignItems: 'center', flexDirection: 'row', marginTop: 3 },
  address: { flex: 1, fontSize: 10, lineHeight: 14, marginLeft: 4 },
  chevron: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    height: 36,
    justifyContent: 'center',
    marginLeft: spacing.xs,
    width: 32,
  },
  pressed: { opacity: 0.68 },
});
