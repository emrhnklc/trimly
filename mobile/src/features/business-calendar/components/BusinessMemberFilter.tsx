import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import type { BusinessMember } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

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
      {members.map((member) => (
        <FilterChip
          imageUrl={member.user.profileImageUrl}
          key={member.id}
          label={member.user.firstName}
          onPress={() => onChange(member.id)}
          selected={selectedMemberId === member.id}
        />
      ))}
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}>
      {imageUrl ? (
        <Image contentFit="cover" source={imageUrl} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    minHeight: 38,
    paddingHorizontal: 7,
    paddingRight: spacing.sm,
  },
  selectedChip: { backgroundColor: colors.darkSurface, borderColor: colors.darkSurface },
  avatar: { borderRadius: radius.pill, height: 26, width: 26 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
  },
  initial: { fontSize: 10, lineHeight: 14 },
  label: { fontSize: 11, lineHeight: 15, maxWidth: 90 },
  pressed: { opacity: 0.72 },
});
