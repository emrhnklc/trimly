import { Redirect } from "expo-router";

// Retired editor links return to the regular profile.
export default function RetiredBarberProfileScreen() {
  return <Redirect href="/(business)/profile" />;
}
