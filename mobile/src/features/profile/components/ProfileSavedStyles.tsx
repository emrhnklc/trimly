import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { CustomerHaircutRecord } from '@/features/haircut-history/types';
import { resolveApiUrl } from '@/lib/api/client';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function ProfileSavedStyles({
  accessToken,
  records,
}: {
  accessToken: string;
  records: CustomerHaircutRecord[];
}) {
  return (
    <View>
      <SectionHeader title="Kaydedilen Stillerim" />
      {records.length ? (
        <ScrollView
          contentContainerStyle={styles.list}
          horizontal
          showsHorizontalScrollIndicator={false}>
          {records.slice(0, 8).map((record) => {
            const photo = record.photos[0];
            return (
              <View key={record.id} style={styles.card}>
                {photo ? (
                  <Image
                    accessibilityLabel={record.styleName ?? record.appointment.serviceNameSnapshot}
                    contentFit="cover"
                    source={{
                      headers: { Authorization: `Bearer ${accessToken}` },
                      uri: resolveApiUrl(photo.url),
                    }}
                    style={styles.image}
                    transition={180}
                  />
                ) : (
                  <View style={[styles.image, styles.placeholder]}>
                    <SymbolView
                      name={{ ios: 'scissors', android: 'content_cut', web: 'content_cut' }}
                      size={28}
                      tintColor={colors.primary}
                    />
                  </View>
                )}
                <AppText numberOfLines={2} style={styles.name} variant="bodySmall">
                  {record.styleName ?? record.appointment.serviceNameSnapshot}
                </AppText>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <SymbolView
              name={{ ios: 'photo.stack', android: 'photo_library', web: 'photo_library' }}
              size={23}
              tintColor={colors.primary}
            />
          </View>
          <View style={styles.emptyCopy}>
            <AppText variant="label">Henüz kayıtlı stilin yok</AppText>
            <AppText color="textMuted" variant="bodySmall">
              Tamamlanan tıraşlarının fotoğraf ve notları burada görünür.
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingRight: spacing.lg },
  card: { width: 98 },
  image: { borderRadius: radius.md, height: 108, width: 98 },
  placeholder: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    justifyContent: 'center',
  },
  name: { marginTop: spacing.xs, textAlign: 'center' },
  emptyState: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    padding: spacing.sm,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  emptyCopy: { flex: 1, marginLeft: spacing.sm },
});
