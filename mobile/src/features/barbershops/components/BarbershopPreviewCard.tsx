import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { BarbershopRating } from '@/features/barbershops/components/BarbershopRating';
import type { PublicBarber, PublicBarbershop } from '@/features/barbershops/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BarbershopPreviewCardProps = {
  barbershop: PublicBarbershop;
  onPress: () => void;
};

function MemberAvatar({ member }: { member: PublicBarber }) {
  const themeColors = useThemeColors();
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  const initial = member.user.firstName.slice(0, 1).toUpperCase();
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return member.user.profileImageUrl && failedImageUrl !== member.user.profileImageUrl ? (
    <Image
      accessibilityLabel={`${fullName} profil fotoğrafı`}
      contentFit="cover"
      onError={() => setFailedImageUrl(member.user.profileImageUrl)}
      source={member.user.profileImageUrl}
      style={styles.memberAvatar}
    />
  ) : (
    <View
      accessibilityLabel={fullName}
      style={[
        styles.memberAvatar,
        styles.memberPlaceholder,
        { backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.surface },
      ]}>
      <AppText color="primary" style={styles.memberInitial} variant="bodySmall">{initial}</AppText>
    </View>
  );
}

export function BarbershopPreviewCard({ barbershop, onPress }: BarbershopPreviewCardProps) {
  const themeColors = useThemeColors();
  const initial = barbershop.name.slice(0, 1).toUpperCase();
  const imageUrl = barbershop.profileImageUrl ?? barbershop.coverImageUrl;
  const members = barbershop.members ?? [];
  const visibleMembers = members.slice(0, 3);
  const remainingMemberCount = Math.max(members.length - visibleMembers.length, 0);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  return (
    <Pressable
      accessibilityLabel={`${barbershop.name} profilini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        {imageUrl && failedImageUrl !== imageUrl ? (
          <Image
            accessibilityLabel={`${barbershop.name} işletme görseli`}
            contentFit="cover"
            onError={() => setFailedImageUrl(imageUrl)}
            onLoad={({ source }) => {
              const aspectRatio = source.width / source.height;
              if (
                source.width < 240 ||
                source.height < 180 ||
                aspectRatio < 0.65 ||
                aspectRatio > 2.5
              ) {
                setFailedImageUrl(imageUrl);
              }
            }}
            source={imageUrl}
            style={styles.image}
          />
        ) : (
          <View style={[styles.placeholderImage, { backgroundColor: themeColors.surfaceMuted }]}>
            <AppText color="primary" style={styles.shopInitial} variant="displayLarge">{initial}</AppText>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={21}
              tintColor={themeColors.primary}
            />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.name} variant="cardTitle">{barbershop.name}</AppText>
            <View style={[styles.chevron, { backgroundColor: themeColors.background }]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={14}
                tintColor={themeColors.textMuted}
              />
            </View>
          </View>

          {barbershop.description?.trim() ? (
            <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
              {barbershop.description.trim()}
            </AppText>
          ) : null}

          {barbershop.address ? (
            <View style={styles.addressRow}>
              <SymbolView
                name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
                size={13}
                tintColor={themeColors.textMuted}
              />
              <AppText color="textMuted" numberOfLines={1} style={styles.address} variant="bodySmall">
                {formatShortAddress(barbershop.address)}
              </AppText>
            </View>
          ) : null}

          {typeof barbershop.distanceKm === 'number' ? (
            <AppText color="primary" style={styles.distance} variant="label">
              {barbershop.distanceKm < 1
                ? `${Math.round(barbershop.distanceKm * 1000)} m uzakta`
                : `${barbershop.distanceKm.toLocaleString('tr-TR')} km uzakta`}
            </AppText>
          ) : null}

          <View style={styles.rating}>
            <BarbershopRating
              compact
              ratingAverage={barbershop.ratingAverage}
              ratingCount={barbershop.ratingCount}
            />
          </View>

          <View style={styles.teamRow}>
            {visibleMembers.length > 0 ? (
              <>
                <View style={styles.memberList}>
                  {visibleMembers.map((member) => <MemberAvatar key={member.id} member={member} />)}
                  {remainingMemberCount ? (
                    <View
                      style={[
                        styles.memberAvatar,
                        styles.memberPlaceholder,
                        { backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.surface },
                      ]}>
                      <AppText color="primary" style={styles.memberInitial} variant="bodySmall">
                        +{remainingMemberCount}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                <AppText color="textMuted" style={styles.teamLabel} variant="bodySmall">Ekibi gör</AppText>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.memberAvatar,
                    styles.memberPlaceholder,
                    { backgroundColor: themeColors.surfaceMuted, borderColor: themeColors.surface },
                  ]}>
                  <SymbolView
                    name={{ ios: 'person.2', android: 'group', web: 'group' }}
                    size={15}
                    tintColor={themeColors.primary}
                  />
                </View>
                <AppText color="textMuted" style={styles.teamLabel} variant="bodySmall">Ekibi gör</AppText>
              </>
            )}
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

function formatShortAddress(address: string) {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const [neighborhood, district, province] = parts.slice(-3);
    return `${neighborhood}, ${district} / ${province}`;
  }
  if (parts.length === 2) return `${parts[0]} / ${parts[1]}`;
  return parts[0] ?? address;
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: {
    alignItems: 'stretch',
    flexDirection: 'row',
    minHeight: 150,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  image: { aspectRatio: 0.8, borderRadius: radius.smallCard, width: 104 },
  placeholderImage: {
    alignItems: 'center',
    aspectRatio: 0.8,
    borderRadius: radius.smallCard,
    justifyContent: 'center',
    width: 104,
  },
  shopInitial: { fontSize: 34, lineHeight: 40 },
  content: { flex: 1, minWidth: 0, paddingLeft: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  name: { flex: 1, fontSize: 17, lineHeight: 22 },
  chevron: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  description: { fontSize: 13, lineHeight: 18, marginTop: spacing.xxs },
  addressRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs },
  address: { flex: 1, fontSize: 12, lineHeight: 17, marginLeft: spacing.xxs },
  rating: { marginTop: spacing.xxs },
  distance: { fontSize: 12, lineHeight: 17, marginTop: spacing.xxs },
  teamRow: { alignItems: 'center', flexDirection: 'row', marginTop: 'auto', paddingTop: spacing.xs },
  memberList: { flexDirection: 'row' },
  memberAvatar: {
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 28,
    marginRight: -5,
    width: 28,
  },
  memberPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitial: { fontSize: 10, lineHeight: 14 },
  teamLabel: { fontSize: 12, lineHeight: 17, marginLeft: spacing.sm },
});
