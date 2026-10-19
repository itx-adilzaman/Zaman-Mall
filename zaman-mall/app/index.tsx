import { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/context/AuthContext";

const ONBOARDING_KEY = "@zaman_onboarding_seen";

export default function RootIndex() {
  const { session, isLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem(ONBOARDING_KEY);
        setHasSeenOnboarding(value === "true");
      } catch (e) {
        setHasSeenOnboarding(true);
      } finally {
        setChecking(false);
      }
    };

    checkOnboarding();
  }, []);

  if (isLoading || checking || hasSeenOnboarding === null) {
    return null;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}

