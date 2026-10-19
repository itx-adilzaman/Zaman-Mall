import { Redirect, Stack, useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthRoutesLayout() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // Jab Supabase PASSWORD_RECOVERY event aaye (email link se)
  // toh user ko reset-password screen par bhejo
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/(auth)/reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return null;

  if (session) {
    return <Redirect href={"/(tabs)"} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
