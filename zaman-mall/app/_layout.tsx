import { Stack } from "expo-router";
import "../global.css";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";
import { AlertProvider } from "../context/AlertContext";
import { CountrySessionProvider } from "../context/CountrySessionContext";
import { queryClient, persister } from "../lib/query-client";
import { usePushNotifications } from "../hooks/usePushNotifications";
import ErrorBoundary from "../components/ErrorBoundary";
import AppUpdateModal from "../components/AppUpdateModal";
import useAppUpdate from "../hooks/useAppUpdate";
import OTAUpdateModal from "../components/OTAUpdateModal";
import useOTAUpdate from "../hooks/useOTAUpdate";
import { useAbandonedCart } from "../hooks/useAbandonedCart";
import { useWelcomeNotification } from "../hooks/usePushNotifications";
import { useWishlistReminder } from "../hooks/useWishlistReminder";
import { useLoginNotification } from "../hooks/useLoginNotification";
import { useState, useEffect } from "react";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Text, TextInput } from "react-native";

// Keep splash visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

// ── Force Inter font on ALL Text & TextInput globally ──────────────────────────
// Patch defaultProps so every Text uses Inter by default
const textDefaultStyle = { fontFamily: "Inter-Regular" };
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.style = [textDefaultStyle, (Text as any).defaultProps?.style];

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.style = [textDefaultStyle, (TextInput as any).defaultProps?.style];

function AppContent() {
  usePushNotifications();
  useAbandonedCart();
  useWelcomeNotification();
  useWishlistReminder();
  useLoginNotification();

  // ── Load Inter fonts ──────────────────────────────────────────────────────────
  const [fontsLoaded, fontError] = useFonts({
    "Inter-Thin":           require("../assets/fonts/Inter_18pt-Thin.ttf"),
    "Inter-ThinItalic":     require("../assets/fonts/Inter_18pt-ThinItalic.ttf"),
    "Inter-ExtraLight":     require("../assets/fonts/Inter_18pt-ExtraLight.ttf"),
    "Inter-Light":          require("../assets/fonts/Inter_18pt-Light.ttf"),
    "Inter-LightItalic":    require("../assets/fonts/Inter_18pt-LightItalic.ttf"),
    "Inter-Regular":        require("../assets/fonts/Inter_18pt-Regular.ttf"),
    "Inter-Italic":         require("../assets/fonts/Inter_18pt-Italic.ttf"),
    "Inter-Medium":         require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "Inter-MediumItalic":   require("../assets/fonts/Inter_18pt-MediumItalic.ttf"),
    "Inter-SemiBold":       require("../assets/fonts/Inter_18pt-SemiBold.ttf"),
    "Inter-SemiBoldItalic": require("../assets/fonts/Inter_18pt-SemiBoldItalic.ttf"),
    "Inter-Bold":           require("../assets/fonts/Inter_18pt-Bold.ttf"),
    "Inter-BoldItalic":     require("../assets/fonts/Inter_18pt-BoldItalic.ttf"),
    "Inter-ExtraBold":      require("../assets/fonts/Inter_18pt-ExtraBold.ttf"),
    "Inter-ExtraBoldItalic":require("../assets/fonts/Inter_18pt-ExtraBoldItalic.ttf"),
    "Inter-Black":          require("../assets/fonts/Inter_18pt-Black.ttf"),
    "Inter-BlackItalic":    require("../assets/fonts/Inter_18pt-BlackItalic.ttf"),
  });

  // ── Existing APK update system (Supabase) ──
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { updateAvailable, isCritical, isLoading } = useAppUpdate();

  // ── New OTA (EAS expo-updates) system ──
  const { isUpdateReady, applyUpdate } = useOTAUpdate();
  const [showOTAModal, setShowOTAModal] = useState(false);

  // Hide splash once fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!isLoading && updateAvailable) {
      setShowUpdateModal(true);
    }
  }, [updateAvailable, isLoading]);

  useEffect(() => {
    if (isUpdateReady) {
      setShowOTAModal(true);
    }
  }, [isUpdateReady]);

  const handleCloseModal = () => {
    if (!isCritical) {
      setShowUpdateModal(false);
    }
  };

  // Wait for fonts before rendering
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerShown: false }} />
      <AppUpdateModal
        visible={showUpdateModal}
        onClose={handleCloseModal}
      />
      <OTAUpdateModal
        visible={showOTAModal}
        onRestart={applyUpdate}
        onDismiss={() => setShowOTAModal(false)}
      />
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AlertProvider>
        <CountrySessionProvider>
          <AuthProvider>
            <PersistQueryClientProvider 
              client={queryClient} 
              persistOptions={{ persister }}
            >
              <AppContent />
            </PersistQueryClientProvider>
          </AuthProvider>
        </CountrySessionProvider>
      </AlertProvider>
    </ThemeProvider>
  );
}
