import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { CustomerAppointment } from '@/features/appointments/types';
import type { PublicBarbershop } from '@/features/barbershops/types';
import type { FavoriteBarbershop } from '@/features/favorites/types';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BookingStartScreenProps = {
  error: string | null;
  favorites: FavoriteBarbershop[];
  isLoading: boolean;
  lastAppointment: CustomerAppointment | null;
  lastShop: PublicBarbershop | null;
  onAllFavoritesPress: () => void;
  onFavoritePress: (slug: string) => void;
  onRepeat: () => void;
  onRetry: () => void;
  onSearchPress: () => void;
};

export function BookingStartScreen({
  error,
  favorites,
  isLoading,
  lastAppointment,
  lastShop,
  onAllFavoritesPress,
  onFavoritePress,
  onRepeat,
  onRetry,
  onSearchPress,
}: BookingStartScreenProps) {
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const favoriteCardWidth =
    favorites.length === 1
      ? Math.min(width - layout.screenHorizontalPadding * 2, 380)
      : Math.max(
          154,
          (width - layout.screenHorizontalPadding * 2 - layout.cardGap) / 2,
        );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} style={styles.scroll}>
      <View style={styles.intro}>
        <AppText style={styles.title} variant="pageTitle">Başlayalım</AppText>
        <AppText color="textMuted" style={styles.subtitle}>
          Randevuna en hızlı şekilde başlayabilirsin.
        </AppText>
      </View>

      {!isLoading && error ? (
        <View style={styles.errorState}>
          <AppText color="danger" style={styles.errorText}>{error}</AppText>
          <View style={styles.retryButton}>
            <AppButton onPress={onRetry} variant="secondary">Tekrar Dene</AppButton>
          </View>
        </View>
      ) : null}

      {!isLoading && !error ? (
        <>
          <View style={styles.sectionTitleRow}>
            <AppText variant="sectionTitle">Son gittiğin berber</AppText>
          </View>

          <LastVisitCard
            appointment={lastAppointment}
            barbershop={lastShop}
            onPress={lastAppointment ? onRepeat : onSearchPress}
          />

          <SectionHeader
            actionLabel={favorites.length ? 'Tümünü gör' : undefined}
            onActionPress={favorites.length ? onAllFavoritesPress : undefined}
            title="Favori berberlerin"
          />
          {favorites.length ? (
            <ScrollView
              contentContainerStyle={styles.favoriteList}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {favorites.map(({ barbershop }) => (
                <FavoriteShopCard
                  barbershop={barbershop}
                  cardWidth={favoriteCardWidth}
                  key={barbershop.id}
                  onPress={() => onFavoritePress(barbershop.slug)}
                />
              ))}
            </ScrollView>
          ) : (
            <AppText color="textMuted" style={styles.emptyFavorites} variant="bodySmall">
              Henüz favori işletmen yok. Beğendiğin dükkânları kaydettiğinde burada göreceksin.
            </AppText>
          )}

          <AppText style={styles.searchTitle} variant="cardTitle">Başka bir berber ara</AppText>
          <Pressable
            accessibilityLabel="Berber veya konum ara"
            accessibilityRole="button"
            onPress={onSearchPress}
            style={({ pressed }) => [
              styles.searchBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && styles.pressed,
            ]}>
            <SymbolView
              name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
              size={20}
              tintColor={colors.textMuted}
            />
            <AppText color="textMuted" style={styles.searchText}>Berber veya konum ara</AppText>
            <SymbolView
              name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
              size={18}
              tintColor={colors.textMuted}
            />
          </Pressable>

          <View style={styles.trustNote}>
            <View style={[styles.trustIcon, { backgroundColor: colors.surfaceMuted }]}>
              <SymbolView
                name={{ ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' }}
                size={21}
                tintColor={colors.primary}
              />
            </View>
            <AppText color="textMuted" style={styles.trustText} variant="bodySmall">
              Hizmet, süre ve işletme bilgileri randevu öncesinde açıkça gösterilir.
            </AppText>
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function LastVisitCard({
  appointment,
  barbershop,
  onPress,
}: {
  appointment: CustomerAppointment | null;
  barbershop: PublicBarbershop | null;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const imageUrl = barbershop?.profileImageUrl ?? barbershop?.coverImageUrl;
  const title = appointment?.barbershop.name ?? 'İlk berberini keşfet';
  const barberName = appointment
    ? `${appointment.businessMember.user.firstName} ${appointment.businessMember.user.lastName}`
    : 'Trimly ile sana uygun işletmeyi bul';
  const serviceLabel = appointment?.serviceNameSnapshot ?? 'Henüz tamamlanan randevun yok';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.lastCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      {imageUrl ? (
        <Image contentFit="cover" source={imageUrl} style={styles.lastImage} />
      ) : (
        <View style={[styles.lastImage, styles.imagePlaceholder, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView
            name={{ ios: 'storefront', android: 'storefront', web: 'storefront' }}
            size={28}
            tintColor={colors.primary}
          />
        </View>
      )}
      <View style={styles.lastContent}>
        <AppText numberOfLines={2} style={styles.lastTitle} variant="cardTitle">{title}</AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.lastMeta} variant="bodySmall">
          {barberName}
        </AppText>
        <View style={styles.lastServiceRow}>
          <SymbolView
            name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
            size={14}
            tintColor={colors.primary}
          />
          <AppText color="textMuted" numberOfLines={2} style={styles.lastService} variant="bodySmall">
            {serviceLabel}
          </AppText>
        </View>
      </View>
      <View style={[styles.continuePill, { backgroundColor: colors.primary }]}>
        <AppText color="onPrimary" style={styles.continueText} variant="label">
          {appointment ? 'Tekrarla' : 'Keşfet'}
        </AppText>
        <SymbolView
          name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
          size={14}
          tintColor={colors.onPrimary}
        />
      </View>
    </Pressable>
  );
}

function FavoriteShopCard({
  barbershop,
  cardWidth,
  onPress,
}: {
  barbershop: PublicBarbershop;
  cardWidth: number;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const imageUrl = barbershop.profileImageUrl ?? barbershop.coverImageUrl;

  return (
    <Pressable
      accessibilityLabel={`${barbershop.name} ile randevu oluştur`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.favoriteCard,
        { backgroundColor: colors.surface, borderColor: colors.border, width: cardWidth },
        pressed && styles.pressed,
      ]}>
      <View style={styles.favoriteImageArea}>
        {imageUrl ? (
          <Image contentFit="cover" source={imageUrl} style={styles.favoriteImage} />
        ) : (
          <View style={[styles.favoriteImage, styles.imagePlaceholder, { backgroundColor: colors.surfaceMuted }]}>
            <SymbolView
              name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
              size={30}
              tintColor={colors.primary}
            />
          </View>
        )}
        <View style={[styles.heartBadge, { backgroundColor: colors.surface }]}>
          <SymbolView
            name={{ ios: 'heart.fill', android: 'favorite', web: 'favorite' }}
            size={14}
            tintColor={colors.primary}
          />
        </View>
      </View>
      <View style={styles.favoriteContent}>
        <AppText numberOfLines={1} style={styles.favoriteName} variant="cardTitle">{barbershop.name}</AppText>
        <AppText color="textMuted" numberOfLines={1} style={styles.favoriteAddress} variant="bodySmall">
          {barbershop.address ?? 'Konum bilgisi yakında'}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 112, paddingHorizontal: layout.screenHorizontalPadding },
  intro: { marginTop: spacing.sm },
  title: { fontSize: 30, lineHeight: 36 },
  subtitle: { fontSize: 15, lineHeight: 21, marginTop: spacing.xxs, opacity: 0.78 },
  loader: { marginTop: spacing.xxxl },
  errorState: { alignItems: 'center', marginTop: spacing.xxxl },
  errorText: { textAlign: 'center' },
  retryButton: { marginTop: spacing.md, minWidth: 180 },
  sectionTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  lastCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 118,
    padding: spacing.xs,
  },
  lastImage: { borderRadius: radius.smallCard, height: 92, width: 92 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  lastContent: { flex: 1, marginLeft: spacing.sm },
  lastTitle: { fontSize: 17, lineHeight: 22 },
  lastMeta: { fontSize: 14, lineHeight: 19, marginTop: 2 },
  lastServiceRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: spacing.xs },
  lastService: { flex: 1, fontSize: 13, lineHeight: 18, marginLeft: spacing.xxs },
  continuePill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xxs,
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  continueText: { fontSize: 12, lineHeight: 16 },
  favoriteList: { gap: layout.cardGap, paddingRight: spacing.lg },
  favoriteCard: {
    borderRadius: radius.smallCard,
    borderWidth: 1,
    overflow: 'hidden',
  },
  favoriteImageArea: { height: 112 },
  favoriteImage: { height: '100%', width: '100%' },
  heartBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    width: 28,
  },
  favoriteContent: { padding: spacing.sm },
  favoriteName: { fontSize: 16, lineHeight: 21 },
  favoriteAddress: { fontSize: 13, lineHeight: 18, marginTop: spacing.xxs },
  emptyFavorites: { lineHeight: 18 },
  searchTitle: { fontSize: 22, lineHeight: 28, marginTop: spacing.xl },
  searchBox: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  searchText: { flex: 1, marginLeft: spacing.sm },
  trustNote: { alignItems: 'center', flexDirection: 'row', marginTop: spacing.xxxl },
  trustIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  trustText: { flex: 1, lineHeight: 17, marginLeft: spacing.sm },
  pressed: { opacity: 0.74 },
});
