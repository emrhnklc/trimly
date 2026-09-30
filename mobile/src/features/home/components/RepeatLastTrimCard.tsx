import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { CustomerAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function RepeatLastTrimCard({
  appointment,
  onPress,
}: {
  appointment: CustomerAppointment | null;
  onPress: () => void;
}) {
  const themeColors = useThemeColors();
  const lastTrimDate = appointment
    ? new Intl.DateTimeFormat('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(appointment.completedAt ?? appointment.startsAt))
    : null;

  return (
    <Pressable
      accessibilityLabel={appointment ? 'Son tıraşını yeniden planla' : 'İlk randevunu planla'}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: themeColors.darkSurface, borderColor: themeColors.darkSurface }, pressed && styles.pressed]}>
      <Image
        contentFit="cover"
        source={require('../../../../assets/images/home/repeat-last-trim.png')}
        style={styles.backgroundImage}
      />
      <View pointerEvents="none" style={styles.overlay} />
      <View style={styles.content}>
        <AppText style={styles.imageTitle} variant="heading">
          {appointment ? 'Son tıraşını tekrar ettir' : 'İlk tarzını oluşturmaya başla'}
        </AppText>
        <AppText numberOfLines={1} style={styles.shop} variant="bodySmall">
          {appointment?.barbershop.name ?? 'Trimly ile uygun berberini keşfet'}
        </AppText>
        <AppText style={styles.imageMeta} variant="bodySmall">
          {lastTrimDate ?? 'Tamamlanan tıraşların burada görünecek'}
        </AppText>
      </View>
      <View style={styles.repeatButton}>
        <SymbolView
          name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
          size={23}
          tintColor={themeColors.onPrimary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderColor: colors.darkSurface,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: layout.sectionGap,
    minHeight: 108,
    overflow: 'hidden',
    padding: spacing.md,
  },
  pressed: { opacity: 0.76 },
  backgroundImage: { bottom: -2, left: -2, position: 'absolute', right: -2, top: -2 },
  overlay: {
    backgroundColor: 'rgba(12, 8, 5, 0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: { flex: 1, paddingRight: spacing.md },
  imageTitle: { color: '#FFFFFF' },
  shop: { color: '#E8DED0', marginBottom: 2, marginTop: spacing.xs },
  imageMeta: { color: '#E8DED0' },
  repeatButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
