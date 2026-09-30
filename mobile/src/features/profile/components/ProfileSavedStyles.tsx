import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import {
  FullscreenImageViewer,
  type FullscreenImage,
} from '@/components/ui/FullscreenImageViewer';
import type { FavoriteStyle } from '@/features/favorites/types';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { resolveApiUrl } from '@/lib/api/client';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type StyleTab = 'favorites' | 'mine';

export function ProfileSavedStyles({
  accessToken,
  favoriteStyles,
  records,
}: {
  accessToken: string;
  favoriteStyles: FavoriteStyle[];
  records: CustomerHaircutRecord[];
}) {
  const colors = useThemeColors();
  const [activeTab, setActiveTab] = useState<StyleTab>('favorites');
  const [viewer, setViewer] = useState<{ images: FullscreenImage[]; index: number } | null>(null);
  const recordsWithPhotos = useMemo(
    () => records.filter((record) => record.photos.length > 0),
    [records],
  );
  const favoriteImages = useMemo(
    () => favoriteStyles.map((style) => ({
      id: style.photo.id,
        label: style.title ?? `${style.barbershop.name} stil fotoğrafı`,
      source: { uri: resolveApiUrl(style.photo.url) },
    })),
    [favoriteStyles],
  );

  return (
    <View style={styles.container}>
      <View accessibilityRole="tablist" style={[styles.segmentedControl, { backgroundColor: colors.surfaceMuted }]}>
        <TabButton active={activeTab === 'favorites'} count={favoriteStyles.length} label="Beğendiklerim" onPress={() => setActiveTab('favorites')} />
        <TabButton active={activeTab === 'mine'} count={recordsWithPhotos.length} label="Kendi Stillerim" onPress={() => setActiveTab('mine')} />
      </View>

      {activeTab === 'favorites' ? (
        favoriteStyles.length ? (
          <View style={styles.grid}>
            {favoriteStyles.map((style, index) => (
              <StyleCard image={favoriteImages[index]} key={style.photo.id} label={style.title ?? style.barbershop.name} onPress={() => setViewer({ images: favoriteImages, index })} />
            ))}
          </View>
        ) : (
          <EmptyState description="İşletme galerilerinde kalbe dokunduğun stiller burada görünür." title="Henüz beğendiğin stil yok" />
        )
      ) : recordsWithPhotos.length ? (
        <View style={styles.grid}>
          {recordsWithPhotos.map((record) => {
            const images = record.photos.map((photo, index) => ({
              id: photo.id,
              label: `${record.styleName ?? record.appointment.serviceNameSnapshot} fotoğrafı ${index + 1}`,
              source: {
                headers: { Authorization: `Bearer ${accessToken}` },
                uri: resolveApiUrl(photo.url),
              },
            }));
            return (
              <StyleCard
                image={images[0]}
                key={record.id}
                label={record.styleName ?? record.appointment.serviceNameSnapshot}
                onPress={images.length ? () => setViewer({ images, index: 0 }) : undefined}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState description="Tamamlanan tıraşlarının fotoğraf ve notları burada görünür." title="Henüz kendi stilin yok" />
      )}

      <FullscreenImageViewer images={viewer?.images ?? []} initialIndex={viewer?.index ?? 0} onClose={() => setViewer(null)} visible={viewer !== null} />
    </View>
  );
}

function TabButton({ active, count, label, onPress }: { active: boolean; count: number; label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.tab, active && { backgroundColor: colors.primary }, pressed && styles.pressed]}>
      <AppText color={active ? 'onPrimary' : 'textMuted'} variant="label">{label}</AppText>
      <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
        <AppText color={active ? 'primary' : 'textMuted'} variant="bodySmall">{count}</AppText>
      </View>
    </Pressable>
  );
}

function StyleCard({ image, label, onPress }: { image?: FullscreenImage; label: string; onPress?: () => void }) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityLabel={image ? `${label} fotoğrafını tam ekran aç` : `${label}, fotoğraf yok`}
      accessibilityRole={image ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {image ? (
        <Image contentFit="cover" source={image.source} style={styles.image} transition={180} />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }} size={30} tintColor={colors.primary} />
        </View>
      )}
      <AppText numberOfLines={2} style={styles.name} variant="label">{label}</AppText>
    </Pressable>
  );
}

function EmptyState({ description, title }: { description: string; title: string }) {
  const colors = useThemeColors();
  return (
    <View style={[styles.emptyState, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={{ ios: 'photo.stack', android: 'photo_library', web: 'photo_library' }} size={23} tintColor={colors.primary} />
      </View>
      <View style={styles.emptyCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText color="textMuted" variant="bodySmall">{description}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  segmentedControl: {
    borderRadius: radius.pill,
    flexDirection: 'row',
    marginBottom: spacing.lg,
    padding: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    minHeight: 44,
  },
  countBadge: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { width: '48.5%' },
  image: { aspectRatio: 0.92, borderRadius: radius.md, width: '100%' },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: spacing.xs, paddingHorizontal: 2 },
  emptyState: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.md,
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyCopy: { flex: 1, gap: 2, marginLeft: spacing.sm },
  pressed: { opacity: 0.72 },
});
