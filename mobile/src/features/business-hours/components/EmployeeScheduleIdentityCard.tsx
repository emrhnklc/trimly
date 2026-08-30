import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { businessRoleLabels } from '@/features/business/role-labels';
import type { BusinessMember } from '@/features/members/types';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function EmployeeScheduleIdentityCard({ member }: { member: BusinessMember }) {
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  const initials = `${member.user.firstName[0] ?? ''}${member.user.lastName[0] ?? ''}`;

  return (
    <View style={styles.card}>
      {member.user.profileImageUrl ? (
        <Image
          accessibilityLabel={`${fullName} profil fotoğrafı`}
          contentFit="cover"
          source={member.user.profileImageUrl}
          style={styles.avatar}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <AppText color="primary" variant="label">{initials}</AppText>
        </View>
      )}
      <View style={styles.copy}>
        <AppText color="onPrimary" style={styles.name} variant="label">{fullName}</AppText>
        <AppText style={styles.role} variant="bodySmall">
          {businessRoleLabels[member.role]}
        </AppText>
      </View>
      <View style={styles.statusIcon}>
        <SymbolView
          name={{ ios: 'calendar.badge.clock', android: 'date_range', web: 'date_range' }}
          size={22}
          tintColor={colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.darkSurface,
    borderRadius: radius.lg,
    flexDirection: 'row',
    marginTop: spacing.md,
    padding: spacing.md,
  },
  avatar: { borderRadius: radius.pill, height: 54, width: 54 },
  avatarPlaceholder: {
    alignItems: 'center',
    backgroundColor: '#F7E9C5',
    justifyContent: 'center',
  },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  name: { fontSize: 16, lineHeight: 22 },
  role: { color: '#DED2C7', marginTop: 2 },
  statusIcon: {
    alignItems: 'center',
    backgroundColor: '#F7E9C5',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
