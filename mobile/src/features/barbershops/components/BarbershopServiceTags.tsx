import { StyleSheet, View } from "react-native";

import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import type { PublicService } from "@/features/barbershops/types";
import { spacing } from "@/theme/spacing";
import { ProfileServiceRow } from "./ProfileServiceRow";

export function BarbershopServiceTags({
  services,
  onServicePress,
  disabled = false,
}: {
  services: PublicService[];
  onServicePress?: (serviceId: string) => void;
  disabled?: boolean;
}) {
  if (!services.length) {
    return (
      <BarbershopEmptyState
        description="İşletme hizmetlerini eklediğinde burada görebileceksin."
        icon={{ ios: "scissors", android: "content_cut", web: "content_cut" }}
        title="Henüz aktif hizmet yok"
      />
    );
  }

  return (
    <View style={styles.list}>
      {services.map((service) => (
        <ProfileServiceRow
          key={service.id}
          service={service}
          disabled={disabled}
          onPress={
            onServicePress ? () => onServicePress(service.id) : undefined
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  serviceCard: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 66,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  serviceIdentity: { flex: 1, paddingRight: spacing.sm },
  duration: { marginTop: 2 },
  price: { fontSize: 16, lineHeight: 21 },
});
