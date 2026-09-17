import { SymbolView } from 'expo-symbols';
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function BusinessPlusPreviewCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel="Trimly Plus hakkında bilgi al"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <ImageBackground
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
        source={require('../../../../assets/images/profile-last-haircut.png')}
        style={styles.background}>
        <View style={styles.overlay} />
        <View style={styles.content}>
          <View style={styles.iconBox}>
            <SymbolView
              name={{ ios: 'crown.fill', android: 'workspace_premium', web: 'workspace_premium' }}
              size={24}
              tintColor={colors.onPrimary}
            />
          </View>
          <View style={styles.copy}>
            <View style={styles.titleRow}>
              <AppText color="onPrimary" style={styles.title} variant="heading">Trimly Plus</AppText>
              <View style={styles.badge}>
                <AppText color="onPrimary" style={styles.badgeText} variant="overline">YAKINDA</AppText>
              </View>
            </View>
          </View>
          <SymbolView
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={21}
            tintColor={colors.onPrimary}
          />
        </View>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    marginTop: spacing.md,
    minHeight: 84,
    overflow: 'hidden',
  },
  background: { minHeight: 84 },
  backgroundImage: { borderRadius: radius.card },
  overlay: { backgroundColor: 'rgba(20, 14, 8, 0.53)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  content: { alignItems: 'center', flex: 1, flexDirection: 'row', paddingHorizontal: spacing.md },
  iconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(28, 20, 12, 0.52)',
    borderColor: '#E9CA79',
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  title: { fontSize: 18, lineHeight: 23 },
  badge: {
    backgroundColor: 'rgba(28, 20, 12, 0.42)',
    borderColor: 'rgba(255, 244, 215, 0.72)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 8, lineHeight: 10 },
  pressed: { opacity: 0.7 },
});
