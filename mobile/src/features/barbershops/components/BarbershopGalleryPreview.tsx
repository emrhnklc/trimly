import { StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BarbershopGalleryPreview() {
  return (
    <View>
      <View style={styles.gallery}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={styles.tile}>
            <SymbolView
              name={{ ios: 'photo', android: 'image', web: 'image' }}
              size={25}
              tintColor={colors.primary}
            />
          </View>
        ))}
      </View>
      <AppText color="textMuted" style={styles.helper} variant="bodySmall">
        İşletme fotoğrafları eklendiğinde burada görünecek.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  gallery: { flexDirection: 'row', gap: spacing.xs },
  tile: {
    alignItems: 'center',
    aspectRatio: 1.15,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    justifyContent: 'center',
  },
  helper: { marginTop: spacing.xs },
});
