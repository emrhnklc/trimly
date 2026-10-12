import { Image } from "expo-image";
import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SymbolView } from "expo-symbols";

import { AppText } from "@/components/ui/AppText";
import {
  FullscreenImageViewer,
  type FullscreenImage,
} from "@/components/ui/FullscreenImageViewer";
import type { FavoriteStyle } from "@/features/favorites/types";
import type { CustomerHaircutRecord } from "@/features/haircut-history/types";
import { resolveApiUrl } from "@/lib/api/client";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export type StyleTab = "favorites" | "mine";

export function ProfileSavedStyles({
  accessToken,
  favoriteStyles,
  records,
  historyHeader,
  historyOwnerLabel = "Ben",
  onOpenAppointment,
  activeTab,
  onTabChange,
}: {
  accessToken: string;
  favoriteStyles: FavoriteStyle[];
  records: CustomerHaircutRecord[];
  historyHeader?: ReactNode;
  historyOwnerLabel?: string;
  onOpenAppointment?: (appointmentId: string) => void;
  activeTab: StyleTab;
  onTabChange: (tab: StyleTab) => void;
}) {
  const colors = useThemeColors();
  const [viewer, setViewer] = useState<{
    images: FullscreenImage[];
    index: number;
  } | null>(null);
  const favoriteImages = useMemo(
    () =>
      favoriteStyles.map((style) => ({
        id: style.photo.id,
        label: style.title ?? `${style.barbershop.name} stil fotoğrafı`,
        source: { uri: resolveApiUrl(style.photo.url) },
      })),
    [favoriteStyles],
  );

  return (
    <View style={styles.container}>
      <View
        accessibilityRole="tablist"
        style={[
          styles.segmentedControl,
          { backgroundColor: colors.surfaceMuted },
        ]}
      >
        <TabButton
          active={activeTab === "favorites"}
          count={favoriteStyles.length}
          label="Beğendiklerim"
          onPress={() => onTabChange("favorites")}
        />
        <TabButton
          active={activeTab === "mine"}
          count={records.length}
          label="Tıraş Geçmişi"
          onPress={() => onTabChange("mine")}
        />
      </View>

      {activeTab === "favorites" ? (
        favoriteStyles.length ? (
          <View style={styles.grid}>
            {favoriteStyles.map((style, index) => (
              <StyleCard
                image={favoriteImages[index]}
                key={style.photo.id}
                label={style.title ?? style.barbershop.name}
                onPress={() => setViewer({ images: favoriteImages, index })}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            description="İşletme galerilerinde kalbe dokunduğun stiller burada görünür."
            title="Henüz beğendiğin stil yok"
          />
        )
      ) : (
        <>
          {historyHeader}
          {records.length ? (
            <View style={styles.historyList}>
              {records.map((record) => {
                const images = record.photos.map((photo, index) => ({
                  id: photo.id,
                  label: `${record.styleName ?? record.appointment.serviceNameSnapshot} fotoğrafı ${index + 1}`,
                  source: {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    uri: resolveApiUrl(photo.url),
                  },
                }));
                return (
                  <View
                    key={record.id}
                    style={[
                      styles.historyCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.historyTitleRow}>
                      <AppText style={styles.historyTitle} variant="cardTitle">
                        {record.styleName ??
                          record.appointment.serviceNameSnapshot}
                      </AppText>
                      <AppText color="textMuted" variant="bodySmall">
                        {new Intl.DateTimeFormat("tr-TR", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }).format(new Date(record.appointment.startsAt))}
                      </AppText>
                    </View>
                    <AppText color="primary" variant="bodySmall">
                      {record.appointment.attendeeNameSnapshot}
                    </AppText>
                    <AppText color="textMuted" variant="bodySmall">
                      {record.appointment.barbershop.name} ·{" "}
                      {record.appointment.businessMember.user.firstName}{" "}
                      {record.appointment.businessMember.user.lastName}
                    </AppText>
                    {record.notes ? (
                      <AppText style={styles.historyNote} variant="bodySmall">
                        {record.notes}
                      </AppText>
                    ) : null}
                    {images.length ? (
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.historyPhotos}
                      >
                        {images.map((image, index) => (
                          <Pressable
                            accessibilityLabel={image.label}
                            accessibilityRole="button"
                            key={image.id}
                            onPress={() => setViewer({ images, index })}
                          >
                            <Image
                              source={image.source}
                              contentFit="cover"
                              style={styles.historyPhoto}
                              transition={180}
                            />
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : (
                      <AppText color="textMuted" variant="bodySmall">
                        Bu kayda fotoğraf eklenmemiş.
                      </AppText>
                    )}
                    {onOpenAppointment ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => onOpenAppointment(record.appointment.id)}
                        style={styles.historyDetails}
                      >
                        <AppText color="primary" variant="label">
                          Randevu detayı
                        </AppText>
                        <SymbolView
                          name={{
                            ios: "chevron.right",
                            android: "chevron_right",
                            web: "chevron_right",
                          }}
                          size={15}
                          tintColor={colors.primary}
                        />
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              description="Tamamlanan randevulara eklenen tıraş notları ve izinli fotoğraflar burada görünür."
              title={
                historyOwnerLabel === "Ben"
                  ? "Henüz tıraş kaydın yok"
                  : historyOwnerLabel === "Tümü"
                    ? "Henüz tıraş kaydı yok"
                    : `${historyOwnerLabel} için henüz tıraş kaydı yok`
              }
            />
          )}
        </>
      )}

      <FullscreenImageViewer
        images={viewer?.images ?? []}
        initialIndex={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
        visible={viewer !== null}
      />
    </View>
  );
}

function TabButton({
  active,
  count,
  label,
  onPress,
}: {
  active: boolean;
  count: number;
  label: string;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tab,
        active && { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <AppText color={active ? "onPrimary" : "textMuted"} variant="label">
        {label}
      </AppText>
      <View style={[styles.countBadge, { backgroundColor: colors.surface }]}>
        <AppText color={active ? "primary" : "textMuted"} variant="bodySmall">
          {count}
        </AppText>
      </View>
    </Pressable>
  );
}

function StyleCard({
  image,
  label,
  onPress,
}: {
  image?: FullscreenImage;
  label: string;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityLabel={
        image ? `${label} fotoğrafını tam ekran aç` : `${label}, fotoğraf yok`
      }
      accessibilityRole={image ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {image ? (
        <Image
          contentFit="cover"
          source={image.source}
          style={styles.image}
          transition={180}
        />
      ) : (
        <View
          style={[
            styles.image,
            styles.placeholder,
            { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <SymbolView
            name={{
              ios: "scissors",
              android: "content_cut",
              web: "content_cut",
            }}
            size={30}
            tintColor={colors.primary}
          />
        </View>
      )}
      <AppText numberOfLines={2} style={styles.name} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const colors = useThemeColors();
  return (
    <View
      style={[
        styles.emptyState,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View
        style={[styles.emptyIcon, { backgroundColor: colors.surfaceMuted }]}
      >
        <SymbolView
          name={{
            ios: "photo.stack",
            android: "photo_library",
            web: "photo_library",
          }}
          size={23}
          tintColor={colors.primary}
        />
      </View>
      <View style={styles.emptyCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText color="textMuted" variant="bodySmall">
          {description}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: spacing.lg },
  segmentedControl: {
    borderRadius: radius.pill,
    flexDirection: "row",
    marginBottom: spacing.lg,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    flexDirection: "row",
    gap: spacing.xs,
    justifyContent: "center",
    minHeight: 44,
  },
  countBadge: {
    alignItems: "center",
    borderRadius: radius.pill,
    justifyContent: "center",
    minHeight: 22,
    minWidth: 22,
    paddingHorizontal: 5,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  historyList: { gap: spacing.md },
  historyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
  },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  historyTitle: { flex: 1 },
  historyNote: { lineHeight: 21, marginVertical: spacing.xs },
  historyPhotos: { gap: spacing.xs, paddingVertical: spacing.xs },
  historyPhoto: { height: 110, width: 110, borderRadius: radius.md },
  historyDetails: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    marginTop: spacing.xs,
    minHeight: 36,
  },
  card: { width: "48.5%" },
  image: { aspectRatio: 0.92, borderRadius: radius.md, width: "100%" },
  placeholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  name: { marginTop: spacing.xs, paddingHorizontal: 2 },
  emptyState: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    padding: spacing.md,
  },
  emptyIcon: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  emptyCopy: { flex: 1, gap: 2, marginLeft: spacing.sm },
  pressed: { opacity: 0.72 },
});
