import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/AppCard';
import { AppText } from '@/components/ui/AppText';
import { BarbershopRating } from '@/features/barbershops/components/BarbershopRating';
import type { PublicBarber, PublicBarbershop } from '@/features/barbershops/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

type BarbershopPreviewCardProps = {
  barbershop: PublicBarbershop;
  onPress: () => void;
};

function MemberAvatar({ member }: { member: PublicBarber }) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  const initial = member.user.firstName.slice(0, 1).toUpperCase();

  return member.user.profileImageUrl ? (
    <Image
      accessibilityLabel={`${fullName} profil fotoğrafı`}
      contentFit="cover"
      source={member.user.profileImageUrl}
      style={styles.memberAvatar}
    />
  ) : (
    <View accessibilityLabel={fullName} style={[styles.memberAvatar, styles.memberPlaceholder]}>
      <AppText color="primary" style={styles.memberInitial} variant="bodySmall">{initial}</AppText>
    </View>
  );
}

export function BarbershopPreviewCard({ barbershop, onPress }: BarbershopPreviewCardProps) {
  const initial = barbershop.name.slice(0, 1).toUpperCase();
  const imageUrl = barbershop.profileImageUrl ?? barbershop.coverImageUrl;
  const members = barbershop.members ?? [];

  return (
    <Pressable
      accessibilityLabel={`${barbershop.name} profilini aç`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      <AppCard style={styles.card}>
        {imageUrl ? (
          <Image
            accessibilityLabel={`${barbershop.name} işletme görseli`}
            contentFit="cover"
            source={imageUrl}
            style={styles.image}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <AppText color="primary" style={styles.shopInitial} variant="displayLarge">{initial}</AppText>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={21}
              tintColor={colors.primary}
            />
          </View>
        )}

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText numberOfLines={1} style={styles.name} variant="heading">{barbershop.name}</AppText>
            <View style={styles.chevron}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={17}
                tintColor={colors.primary}
              />
            </View>
          </View>

          <AppText color="textMuted" numberOfLines={2} style={styles.description} variant="bodySmall">
            {barbershop.description || 'Hizmetleri ve randevu seçeneklerini incele.'}
          </AppText>

          {barbershop.address ? (
            <View style={styles.addressRow}>
              <SymbolView
                name={{ ios: 'mappin', android: 'location_on', web: 'location_on' }}
                size={13}
                tintColor={colors.textMuted}
              />
              <AppText color="textMuted" numberOfLines={1} style={styles.address} variant="bodySmall">
                {barbershop.address}
              </AppText>
            </View>
          ) : null}

          <View style={styles.rating}>
            <BarbershopRating
              compact
              ratingAverage={barbershop.ratingAverage}
              ratingCount={barbershop.ratingCount}
            />
          </View>

          <View style={styles.teamRow}>
            {members.length > 0 ? (
              <>
                <View style={styles.memberList}>
                  {members.map((member) => <MemberAvatar key={member.id} member={member} />)}
                </View>
                <AppText color="textMuted" style={styles.teamLabel} variant="bodySmall">Ekibi gör</AppText>
              </>
            ) : (
              <AppText color="textMuted" style={styles.teamLabel} variant="bodySmall">
                Ekibi profilde incele
              </AppText>
            )}
          </View>
        </View>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.8 },
  card: {
    alignItems: 'stretch',
    flexDirection: 'row',
    minHeight: 168,
    overflow: 'hidden',
    padding: spacing.xs,
  },
  image: { borderRadius: radius.md, width: 118 },
  placeholderImage: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    justifyContent: 'center',
    width: 118,
  },
  shopInitial: { fontSize: 42, lineHeight: 48 },
  content: { flex: 1, paddingBottom: spacing.xxs, paddingLeft: spacing.md, paddingTop: spacing.xxs },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xxs },
  name: { flex: 1, fontSize: 17, lineHeight: 22 },
  chevron: {
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  description: { fontSize: 12, lineHeight: 16, marginTop: spacing.xxs },
  addressRow: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xs },
  address: { flex: 1, fontSize: 11, lineHeight: 15, marginLeft: spacing.xxs },
  rating: { marginTop: spacing.xxs },
  teamRow: { alignItems: 'center', flexDirection: 'row', marginTop: 'auto', paddingTop: spacing.xs },
  memberList: { flexDirection: 'row', gap: spacing.xxs },
  memberAvatar: {
    borderColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 30,
    width: 30,
  },
  memberPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  memberInitial: { fontSize: 11, lineHeight: 14 },
  teamLabel: { fontSize: 10, lineHeight: 14, marginLeft: spacing.xs },
});
