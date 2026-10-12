import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "@/components/ui/AppText";
import type { AuthUser } from "@/features/auth/types";
import { DependentAvatar } from "@/features/dependents/components/DependentAvatar";
import {
  getDependentRelationshipLabel,
  type DependentProfile,
} from "@/features/dependents/types";
import { radius, spacing } from "@/theme/spacing";
import { useThemeColors } from "@/theme/useThemeColors";

export type AppointmentAttendeeFilter = "ALL" | "SELF" | `DEPENDENT:${string}`;

export function AppointmentAttendeeFilterSheet({
  dependents,
  onClose,
  onSelect,
  selected,
  user,
  visible,
  title = "Randevu sahibi",
  allDescription = "Senin ve yakınlarının bütün randevuları",
  additionalAttendees = [],
}: {
  dependents: DependentProfile[];
  onClose: () => void;
  onSelect: (filter: AppointmentAttendeeFilter) => void;
  selected: AppointmentAttendeeFilter;
  user: AuthUser | null;
  visible: boolean;
  title?: string;
  allDescription?: string;
  additionalAttendees?: { id: string; name: string }[];
}) {
  const colors = useThemeColors();

  function select(filter: AppointmentAttendeeFilter) {
    onSelect(filter);
    onClose();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={styles.overlay}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <View>
              <AppText variant="sectionTitle">{title}</AppText>
              <AppText color="textMuted" variant="bodySmall">
                Görüntülemek istediğin kişiyi seç.
              </AppText>
            </View>
            <Pressable
              accessibilityLabel="Kapat"
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.close, { backgroundColor: colors.surfaceMuted }]}
            >
              <SymbolView
                name={{ ios: "xmark", android: "close", web: "close" }}
                size={17}
                tintColor={colors.text}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.options}
            showsVerticalScrollIndicator={false}
          >
            <FilterOption
              avatar={
                <SymbolView
                  name={{ ios: "person.2", android: "group", web: "group" }}
                  size={22}
                  tintColor={colors.primary}
                />
              }
              isSelected={selected === "ALL"}
              meta={allDescription}
              onPress={() => select("ALL")}
              title="Tümü"
            />
            {user ? (
              <FilterOption
                avatar={
                  user.profileImageUrl ? (
                    <Image
                      contentFit="cover"
                      source={user.profileImageUrl}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <DependentAvatar
                      firstName={user.firstName}
                      lastName={user.lastName}
                    />
                  )
                }
                isSelected={selected === "SELF"}
                meta={`${user.firstName} ${user.lastName}`}
                onPress={() => select("SELF")}
                title="Ben"
              />
            ) : null}
            {dependents.map((dependent) => {
              const filter = `DEPENDENT:${dependent.id}` as const;
              return (
                <FilterOption
                  avatar={
                    <DependentAvatar
                      firstName={dependent.firstName}
                      lastName={dependent.lastName}
                    />
                  }
                  isSelected={selected === filter}
                  key={dependent.id}
                  meta={getDependentRelationshipLabel(dependent)}
                  onPress={() => select(filter)}
                  title={`${dependent.firstName} ${dependent.lastName}`}
                />
              );
            })}
            {additionalAttendees.map((attendee) => (
              <FilterOption
                avatar={
                  <SymbolView
                    name={{ ios: "person", android: "person", web: "person" }}
                    size={22}
                    tintColor={colors.primary}
                  />
                }
                isSelected={selected === `DEPENDENT:${attendee.id}`}
                key={attendee.id}
                meta="Arşivlenmiş yakın · geçmiş kayıtları"
                onPress={() => select(`DEPENDENT:${attendee.id}`)}
                title={attendee.name}
              />
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FilterOption({
  avatar,
  isSelected,
  meta,
  onPress,
  title,
}: {
  avatar: ReactNode;
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
        styles.option,
        {
          backgroundColor: isSelected ? colors.surfaceMuted : colors.background,
          borderColor: isSelected ? colors.primary : colors.border,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.avatar, { backgroundColor: colors.surfaceMuted }]}>
        {avatar}
      </View>
      <View style={styles.copy}>
        <AppText variant="cardTitle">{title}</AppText>
        <AppText color="textMuted" variant="bodySmall">
          {meta}
        </AppText>
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: isSelected ? colors.primary : colors.textMuted },
        ]}
      >
        {isSelected ? (
          <View
            style={[styles.radioDot, { backgroundColor: colors.primary }]}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: "rgba(12, 8, 5, 0.58)",
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: radius.card,
    borderTopRightRadius: radius.card,
    borderWidth: 1,
    maxHeight: "76%",
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  handle: {
    alignSelf: "center",
    borderRadius: radius.pill,
    height: 4,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
    width: 44,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  close: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  options: { gap: spacing.sm, paddingBottom: spacing.sm },
  option: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    minHeight: 70,
    padding: spacing.sm,
  },
  avatar: {
    alignItems: "center",
    borderRadius: radius.pill,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  avatarImage: { height: 48, width: 48 },
  copy: { flex: 1, marginHorizontal: spacing.sm },
  radio: {
    alignItems: "center",
    borderRadius: radius.pill,
    borderWidth: 2,
    height: 23,
    justifyContent: "center",
    width: 23,
  },
  radioDot: { borderRadius: radius.pill, height: 11, width: 11 },
  pressed: { opacity: 0.7 },
});
