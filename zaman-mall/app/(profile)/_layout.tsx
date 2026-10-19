import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="orders" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="wishlist" />
      <Stack.Screen name="privacy-security" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="contact" />
    </Stack>
  );
}
