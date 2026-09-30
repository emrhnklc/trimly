import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import type { AuthUser } from '@/features/auth/types';
import { DependentAvatar } from '@/features/dependents/components/DependentAvatar';
import {
  dependentRelationshipLabels,
  getDependentAge,
  type DependentProfile,
} from '@/features/dependents/types';
import { layout, radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

export function BookingAttendeePicker({
  dependents,
  isLoading,
  onAddDependent,
  onContinue,
  onSelect,
  selectedDependentId,
  user,
}: {
  dependents: DependentProfile[];
  isLoading: boolean;
  onAddDependent: () => void;
  onContinue: () => void;
  onSelect: (dependentId: string | null) => void;
  selectedDependentId: string | null;
  user: AuthUser;
}) {
  const colors = useThemeColors();
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <AppText style={styles.title} variant="displayMedium">Kimin için randevu alıyorsun?</AppText>
      <AppText color="textMuted" style={styles.description}>
        Aynı kişi için aynı gün yalnızca bir aktif randevu oluşturabilirsin. Yakının için ayrı profil seçebilirsin.
      </AppText>

      <AttendeeCard
        avatar={user.profileImageUrl ? <Image contentFit="cover" source={user.profileImageUrl} style={styles.avatar} /> : <DependentAvatar firstName={user.firstName} lastName={user.lastName} />}
        isSelected={selectedDependentId === null}
        meta={`${user.firstName} ${user.lastName}`}
        onPress={() => onSelect(null)}
        title="Ben"
      />

      {dependents.map((dependent) => {
        const age = getDependentAge(dependent.birthDate);
        return (
          <AttendeeCard
            avatar={<DependentAvatar firstName={dependent.firstName} lastName={dependent.lastName} />}
            badge={dependentRelationshipLabels[dependent.relationship]}
            isSelected={selectedDependentId === dependent.id}
            key={dependent.id}
            meta={age === null ? 'Yaş bilgisi yok' : `${age} yaş`}
            onPress={() => onSelect(dependent.id)}
            title={`${dependent.firstName} ${dependent.lastName}`}
          />
        );
      })}

      <Pressable
        accessibilityRole="button"
        onPress={onAddDependent}
        style={({ pressed }) => [
          styles.addCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.addIcon, { backgroundColor: colors.surfaceMuted }]}>
          <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} size={22} tintColor={colors.primary} />
        </View>
        <View style={styles.cardCopy}>
          <AppText variant="cardTitle">Yeni yakın ekle</AppText>
          <AppText color="textMuted" variant="bodySmall">Çocuğun veya yakının için</AppText>
        </View>
        <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} size={18} tintColor={colors.textMuted} />
      </Pressable>

      <View style={[styles.limitCard, { backgroundColor: colors.surfaceMuted }]}>
        <SymbolView name={{ ios: 'calendar.badge.checkmark', android: 'event_available', web: 'event_available' }} size={22} tintColor={colors.primary} />
        <View style={styles.cardCopy}>
          <AppText variant="label">Günlük limit</AppText>
          <AppText color="textMuted" variant="bodySmall">Her profil için günde 1 aktif randevu.</AppText>
        </View>
      </View>

      <View style={styles.continueButton}>
        <AppButton disabled={isLoading} onPress={onContinue}>Devam Et →</AppButton>
      </View>
    </ScrollView>
  );
}

function AttendeeCard({ avatar, badge, isSelected, meta, onPress, title }: {
  avatar: ReactNode;
  badge?: string;
  isSelected: boolean;
  meta: string;
  onPress: () => void;
  title: string;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.attendeeCard,
        { backgroundColor: colors.surface, borderColor: isSelected ? colors.primary : colors.border },
        pressed && styles.pressed,
      ]}
    >
      {avatar}
      <View style={styles.cardCopy}>
        <View style={styles.titleRow}>
          <AppText numberOfLines={1} style={styles.cardTitle} variant="cardTitle">{title}</AppText>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.surfaceMuted }]}>
              <AppText color="primary" style={styles.badgeText} variant="label">{badge}</AppText>
            </View>
          ) : null}
        </View>
        <AppText color="textMuted" variant="bodySmall">{meta}</AppText>
      </View>
      <View style={[styles.radio, { borderColor: isSelected ? colors.primary : colors.textMuted }]}>
        {isSelected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 112, paddingHorizontal: layout.screenHorizontalPadding },
  title: { fontSize: 30, lineHeight: 36, marginTop: spacing.md },
  description: { lineHeight: 21, marginBottom: spacing.lg, marginTop: spacing.xs },
  attendeeCard: { alignItems: 'center', borderRadius: radius.card, borderWidth: 1, flexDirection: 'row', marginBottom: spacing.sm, padding: spacing.sm },
  avatar: { borderRadius: radius.pill, height: 52, width: 52 },
  cardCopy: { flex: 1, marginHorizontal: spacing.sm },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs },
  cardTitle: { flexShrink: 1 },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.xs, paddingVertical: 3 },
  badgeText: { fontSize: 10, lineHeight: 13 },
  radio: { alignItems: 'center', borderRadius: radius.pill, borderWidth: 2, height: 25, justifyContent: 'center', width: 25 },
  radioDot: { borderRadius: radius.pill, height: 13, width: 13 },
  addCard: { alignItems: 'center', borderRadius: radius.card, borderWidth: 1, flexDirection: 'row', marginTop: spacing.xs, padding: spacing.sm },
  addIcon: { alignItems: 'center', borderRadius: radius.pill, height: 52, justifyContent: 'center', width: 52 },
  limitCard: { alignItems: 'center', borderRadius: radius.card, flexDirection: 'row', marginTop: spacing.md, padding: spacing.md },
  continueButton: { marginTop: spacing.lg },
  pressed: { opacity: 0.7 },
});
