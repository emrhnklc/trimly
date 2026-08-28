import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { SymbolView } from 'expo-symbols';

import { AppText } from '@/components/ui/AppText';
import type { CustomerAppointment } from '@/features/appointments/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function RepeatLastTrimCard({
  appointment,
  onPress,
}: {
  appointment: CustomerAppointment | null;
  onPress: () => void;
}) {
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
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Image
        contentFit="cover"
        source={require('../../../../assets/images/home/repeat-last-trim.png')}
        style={styles.backgroundImage}
      />
      <View pointerEvents="none" style={styles.overlay} />
      <View style={styles.content}>
        <AppText color="surface" variant="heading">
          {appointment ? 'Son tıraşını tekrar ettir' : 'İlk tarzını oluşturmaya başla'}
        </AppText>
        <AppText color="surfaceMuted" numberOfLines={1} style={styles.shop} variant="bodySmall">
          {appointment?.barbershop.name ?? 'Trimly ile uygun berberini keşfet'}
        </AppText>
        <AppText color="surfaceMuted" variant="bodySmall">
          {lastTrimDate ?? 'Tamamlanan tıraşların burada görünecek'}
        </AppText>
      </View>
      <View style={styles.repeatButton}>
        <SymbolView
          name={{ ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' }}
          size={23}
          tintColor={colors.onPrimary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.md,
    flexDirection: 'row',
    marginTop: spacing.xxl,
    minHeight: 108,
    overflow: 'hidden',
    padding: spacing.md,
  },
  pressed: { opacity: 0.76 },
  backgroundImage: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
  overlay: {
    backgroundColor: 'rgba(16, 10, 7, 0.16)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: { flex: 1, paddingRight: spacing.md },
  shop: { marginBottom: 2, marginTop: spacing.xs },
  repeatButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
});
