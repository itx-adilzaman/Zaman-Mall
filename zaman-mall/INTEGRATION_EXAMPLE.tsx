/**
 * Integration Example: App Update Modal in Root Layout
 * 
 * This file demonstrates how to integrate the AppUpdateModal
 * into your Zaman Mall mobile app.
 * 
 * Location: app/_layout.tsx or App.tsx
 */

import React, { useState, useEffect } from "react";
import { Slot, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppUpdateModal from "@/components/AppUpdateModal";
import useAppUpdate from "@/hooks/useAppUpdate";

export default function RootLayout() {
  const router = useRouter();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { updateAvailable, isCritical, isLoading } = useAppUpdate();

  useEffect(() => {
    // Show modal when update check completes and update is available
    if (!isLoading && updateAvailable) {
      setShowUpdateModal(true);
    }
  }, [updateAvailable, isLoading]);

  const handleCloseModal = () => {
    // Only allow closing for non-critical updates
    if (!isCritical) {
      setShowUpdateModal(false);
    }
    // For critical updates, the modal cannot be closed
  };

  return (
    <SafeAreaProvider>
      {/* Your existing app content */}
      <Slot />
      
      {/* In-App Update Modal */}
      <AppUpdateModal
        visible={showUpdateModal}
        onClose={handleCloseModal}
      />
    </SafeAreaProvider>
  );
}

/**
 * Alternative: Manual Update Check Button
 * 
 * Add this to your settings screen or profile section
 * to allow users to manually check for updates.
 */

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { RefreshCw } from "lucide-react-native";

function CheckForUpdatesButton() {
  const { checkForUpdates, updateAvailable, isLoading } = useAppUpdate();
  const [showModal, setShowModal] = useState(false);

  const handleCheckUpdates = async () => {
    await checkForUpdates();
    if (updateAvailable) {
      setShowModal(true);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handleCheckUpdates}
        disabled={isLoading}
      >
        <RefreshCw size={20} color="#2563eb" />
        <Text style={styles.buttonText}>
          {isLoading ? "Checking..." : "Check for Updates"}
        </Text>
      </TouchableOpacity>

      <AppUpdateModal
        visible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
  },
});

/**
 * Alternative: Splash Screen Integration
 * 
 * Show the update modal right after the splash screen
 * for a seamless first-launch experience.
 */

import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";

function SplashScreenWithUpdateCheck() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { updateAvailable, isLoading } = useAppUpdate();

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts
        await useFonts({
          // Your font loading logic
        });

        // Check for updates
        if (!isLoading && updateAvailable) {
          setShowUpdateModal(true);
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null; // Splash screen is showing
  }

  return (
    <SafeAreaProvider>
      <Slot />
      <AppUpdateModal
        visible={showUpdateModal}
        onClose={() => !isCritical && setShowModal(false)}
      />
    </SafeAreaProvider>
  );
}

/**
 * Version Display Component
 * 
 * Display current app version in settings or about screen
 */

import Constants from "expo-constants";

function VersionDisplay() {
  const currentVersion = Constants.expoConfig?.version || "1.0.0";
  const { latestVersion, updateAvailable } = useAppUpdate();

  return (
    <View style={styles.versionContainer}>
      <Text style={styles.versionLabel}>Current Version:</Text>
      <Text style={styles.versionText}>{currentVersion}</Text>
      
      {latestVersion && updateAvailable && (
        <View style={styles.updateBadge}>
          <Text style={styles.updateBadgeText}>
            New version {latestVersion.version_code} available!
          </Text>
        </View>
      )}
    </View>
  );
}

const versionStyles = StyleSheet.create({
  versionContainer: {
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 16,
  },
  versionLabel: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 4,
  },
  versionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  updateBadge: {
    marginTop: 8,
    backgroundColor: "#dbeafe",
    padding: 8,
    borderRadius: 6,
  },
  updateBadgeText: {
    fontSize: 14,
    color: "#1d4ed8",
    fontWeight: "500",
  },
});
