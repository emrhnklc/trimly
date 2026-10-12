import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui/AppText";
import { businessRoleLabels } from "@/features/business/role-labels";
import type { BusinessMember } from "@/features/members/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export function BusinessMemberCard({
  member,
  onPress,
}: {
  member: BusinessMember;
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const fullName = `${member.user.firstName} ${member.user.lastName}`;
  const initials = `${member.user.firstName[0] ?? ""}${member.user.lastName[0] ?? ""}`;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        !member.isActive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {member.user.profileImageUrl ? (
        <Image
          accessibilityLabel={`${fullName} profil fotoğrafı`}
          contentFit="cover"
          source={member.user.profileImageUrl}
          style={styles.avatar}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            styles.avatarPlaceholder,
            { backgroundColor: colors.surfaceMuted },
          ]}
        >
          <AppText color="primary" variant="label">
            {initials}
          </AppText>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <AppText numberOfLines={1} style={styles.name} variant="label">
            {fullName}
          </AppText>
          {member.role === "OWNER" ? (
            <View
              style={[
                styles.ownerBadge,
                { backgroundColor: colors.surfaceMuted },
              ]}
            >
              <AppText
                color="primary"
                style={styles.ownerLabel}
                variant="label"
              >
                Sahip
              </AppText>
            </View>
          ) : null}
        </View>
        <AppText color="textMuted" style={styles.role} variant="bodySmall">
          {businessRoleLabels[member.role]}
        </AppText>
        <View style={styles.metaRow}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: member.isActive
                  ? colors.success
                  : colors.textMuted,
              },
            ]}
          />
          <AppText color="textMuted" style={styles.meta} variant="bodySmall">
            {member.isActive ? "Aktif" : "Pasif"}
          </AppText>
          {member.isActive && member.isBookable ? (
            <>
              <View
                style={[
                  styles.metaSeparator,
                  { backgroundColor: colors.border },
                ]}
              />
              <AppText color="primary" style={styles.meta} variant="bodySmall">
                Randevuya açık
              </AppText>
            </>
          ) : null}
        </View>
        {!member.isBookable && (member.outstandingAppointmentCount ?? 0) > 0 ? (
          <AppText color="primary" style={styles.role} variant="bodySmall">
            {member.outstandingAppointmentCount} mevcut randevu · İncele
          </AppText>
        ) : null}
      </View>

      {onPress ? (
        <SymbolView
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={16}
          tintColor={colors.textMuted}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    borderRadius: radius.card,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: spacing.sm,
    minHeight: 84,
    padding: spacing.sm,
  },
  inactive: { opacity: 0.68 },
  pressed: { opacity: 0.68 },
  avatar: { borderRadius: radius.pill, height: 46, width: 46 },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, marginHorizontal: spacing.sm, minWidth: 0 },
  nameRow: { alignItems: "center", flexDirection: "row" },
  name: { flexShrink: 1, fontSize: 16, lineHeight: 21 },
  ownerBadge: {
    borderRadius: radius.pill,
    marginLeft: spacing.xs,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  ownerLabel: { fontSize: 8, lineHeight: 11 },
  role: { fontSize: 10, lineHeight: 14, marginTop: 2 },
  metaRow: { alignItems: "center", flexDirection: "row", marginTop: 5 },
  statusDot: { borderRadius: radius.pill, height: 5, width: 5 },
  meta: { fontSize: 9, lineHeight: 12, marginLeft: 4 },
  metaSeparator: {
    borderRadius: radius.pill,
    height: 3,
    marginLeft: spacing.xs,
    width: 3,
  },
});
