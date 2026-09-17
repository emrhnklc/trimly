import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessMember } from '@/features/members/types';
import { radius, spacing } from '@/theme/spacing';
import { useThemeColors } from '@/theme/useThemeColors';

type BusinessMemberFilterProps = {
  members: BusinessMember[];
  onChange: (memberId: string | null) => void;
  selectedMemberId: string | null;
};

export function BusinessMemberFilter({
  members,
  onChange,
  selectedMemberId,
}: BusinessMemberFilterProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      horizontal
      showsHorizontalScrollIndicator={false}>
      <FilterChip label="Tüm ekip" onPress={() => onChange(null)} selected={!selectedMemberId} />
      {members.map((member) => {
        if (!member.user) return null;

        return (
          <FilterChip
            imageUrl={member.user.profileImageUrl}
            key={member.id}
            label={member.user.firstName}
            onPress={() => onChange(member.id)}
            selected={selectedMemberId === member.id}
          />
        );
      })}
    </ScrollView>
  );
}

function FilterChip({
  imageUrl,
  label,
  onPress,
  selected,
}: {
  imageUrl?: string | null;
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  const themeColors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? themeColors.primary : themeColors.surface,
          borderColor: selected ? themeColors.primary : themeColors.border,
        },
        pressed && styles.pressed,
      ]}>
      {imageUrl ? (
        <Image contentFit="cover" source={imageUrl} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            {
              backgroundColor: selected
                ? 'rgba(255,255,255,0.18)'
                : themeColors.surfaceMuted,
            },
          ]}>
          <AppText color={selected ? 'onPrimary' : 'primary'} style={styles.initial} variant="label">
            {label[0]?.toLocaleUpperCase('tr-TR')}
          </AppText>
        </View>
      )}
      <AppText
        color={selected ? 'onPrimary' : 'text'}
        numberOfLines={1}
        style={styles.label}
        variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xs, paddingRight: spacing.lg },
  chip: {
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 7,
    paddingRight: spacing.sm,
  },
  avatar: { borderRadius: radius.pill, height: 26, width: 26 },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 10, lineHeight: 14 },
  label: { fontSize: 11, lineHeight: 15, maxWidth: 90 },
  pressed: { opacity: 0.72 },
});
