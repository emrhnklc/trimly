import { StyleSheet, View } from "react-native";

import { AppCard } from "@/components/ui/AppCard";
import { AppText } from "@/components/ui/AppText";
import { BarbershopEmptyState } from "@/features/barbershops/components/BarbershopEmptyState";
import type { PublicService } from "@/features/barbershops/types";
import { spacing } from "@/theme/spacing";

export function BarbershopServiceTags({
  services,
}: {
  services: PublicService[];
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
        <AppCard key={service.id} style={styles.serviceCard}>
          <View style={styles.serviceIdentity}>
            <AppText numberOfLines={1} variant="cardTitle">
              {service.name}
            </AppText>
            <AppText
              color="textMuted"
              style={styles.duration}
              variant="bodySmall"
            >
              {service.durationMinutes} dk
            </AppText>
          </View>
          <AppText color="primary" style={styles.price} variant="cardTitle">
            {formatPrice(service.price)}
          </AppText>
        </AppCard>
      ))}
    </View>
  );
}

function formatPrice(value: string) {
  const price = Number(value);
  if (!Number.isFinite(price)) return `₺${value}`;
  return `₺${price.toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: price % 1 === 0 ? 0 : 2,
  })}`;
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
