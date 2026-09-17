import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

import { AppIconButton } from "./AppIconButton";
import { AppText } from "./AppText";

export function SettingsPageHeader({
  onBackPress,
  title,
}: {
  onBackPress?: () => void;
  title: string;
}) {
  const router = useRouter();
  return (
    <View style={styles.topBar}>
      <AppIconButton
        accessibilityLabel="Geri"
        icon={{ ios: "chevron.left", android: "arrow_back", web: "arrow_back" }}
        onPress={onBackPress ?? (() => router.back())}
        variant="transparent"
      />
      <AppText numberOfLines={2} style={styles.title} variant="pageTitle">
        {title}
      </AppText>
      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { alignItems: "center", flexDirection: "row", minHeight: 70 },
  title: { flex: 1, fontSize: 25, lineHeight: 32, textAlign: "center" },
  spacer: { width: 44 },
});
