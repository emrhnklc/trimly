import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { TrimlyLogo } from "@/components/branding/TrimlyLogo";
import { spacing } from "@/theme/spacing";
import { AppText } from "./AppText";

export function BrandedPageHeader({
  rightAccessory,
  subtitle,
  title,
}: {
  rightAccessory?: ReactNode;
  subtitle?: string;
  title?: string;
}) {
  return (
    <View style={title ? styles.pageHeader : styles.profileHeader}>
      <View style={styles.logoRow}>
        <View style={styles.side} />
        <TrimlyLogo size="small" />
        <View style={styles.side}>{rightAccessory}</View>
      </View>
      {title ? (
        <>
          <AppText style={styles.title} variant="pageTitle">
            {title}
          </AppText>
          {subtitle ? (
            <AppText color="textMuted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pageHeader: { marginBottom: spacing.xs },
  profileHeader: { marginBottom: spacing.sm },
  logoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    minHeight: 48,
  },
  side: { alignItems: "flex-end", width: 44 },
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.xs },
});
