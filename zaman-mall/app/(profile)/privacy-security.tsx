import SafeScreen from "@/components/SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View, Image } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "@/context/AlertContext";

const SETTINGS_STORAGE_KEY = "@privacy_security_settings";

type SecurityOption = {
  id: string;
  icon: string;
  title: string;
  description: string;
  type: "navigation" | "toggle";
  value?: boolean;
};

function PrivacyAndSecurityScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  
  // State for all settings
  const [settings, setSettings] = useState({
    twoFactorEnabled: false,
    biometricEnabled: true,
    pushNotifications: true,
    emailNotifications: true,
    marketingEmails: false,
    shareData: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load settings from AsyncStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Save settings whenever they change
  useEffect(() => {
    if (!isLoading) {
      const saveSettings = async () => {
        try {
          await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
          console.error("Failed to save settings:", error);
        }
      };
      saveSettings();
    }
  }, [settings, isLoading]);

  const securitySettings: SecurityOption[] = [
    {
      id: "password",
      icon: "lock-closed-outline",
      title: "Change Password",
      description: "Update your account password",
      type: "navigation",
    },
    {
      id: "two-factor",
      icon: "shield-checkmark-outline",
      title: "Two-Factor Authentication",
      description: "Add an extra layer of security",
      type: "toggle",
      value: settings.twoFactorEnabled,
    },
    {
      id: "biometric",
      icon: "finger-print-outline",
      title: "Biometric Login",
      description: "Use Face ID or Touch ID",
      type: "toggle",
      value: settings.biometricEnabled,
    },
  ];

  const privacySettings: SecurityOption[] = [
    {
      id: "push",
      icon: "notifications-outline",
      title: "Push Notifications",
      description: "Receive push notifications",
      type: "toggle",
      value: settings.pushNotifications,
    },
    {
      id: "email",
      icon: "mail-outline",
      title: "Email Notifications",
      description: "Receive order updates via email",
      type: "toggle",
      value: settings.emailNotifications,
    },
    {
      id: "marketing",
      icon: "megaphone-outline",
      title: "Marketing Emails",
      description: "Receive promotional emails",
      type: "toggle",
      value: settings.marketingEmails,
    },
    {
      id: "data",
      icon: "analytics-outline",
      title: "Share Usage Data",
      description: "Help us improve the app",
      type: "toggle",
      value: settings.shareData,
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    if (id === "two-factor" || id === "password") return; // User excluded these

    setSettings(prev => {
      const newSettings = { ...prev };
      switch (id) {
        case "biometric":
          newSettings.biometricEnabled = value;
          break;
        case "push":
          newSettings.pushNotifications = value;
          break;
        case "email":
          newSettings.emailNotifications = value;
          break;
        case "marketing":
          newSettings.marketingEmails = value;
          break;
        case "data":
          newSettings.shareData = value;
          break;
      }
      return newSettings;
    });
  };

  const handleAccountAction = (id: string) => {
    switch (id) {
      case "activity":
        showAlert({
          title: "Account Activity",
          message: "Your last login was from Karachi, Pakistan on Feb 13, 2026 at 10:45 AM.\n\nNo suspicious activity detected.",
          icon: "time-outline",
        });
        break;
      case "devices":
        showAlert({
          title: "Connected Devices",
          message: "1. iPhone 15 Pro (This device) - Active Now\n2. Windows PC (Chrome) - Last active 2 hours ago",
          icon: "phone-portrait-outline",
          buttons: [
            { text: "Manage Devices", onPress: () => {} },
            { text: "Close", onPress: () => {}, style: "cancel" }
          ]
        });
        break;
      case "data-download":
        showAlert({
          title: "Download Data",
          message: "A request to download your data has been received. We will send a download link to your registered email address within 24 hours.",
          icon: "download-outline",
        });
        break;
    }
  };

  const accountSettings = [
    {
      id: "activity",
      icon: "time-outline",
      title: "Account Activity",
      description: "View recent login activity",
    },
    {
      id: "devices",
      icon: "phone-portrait-outline",
      title: "Connected Devices",
      description: "Manage devices with access",
    },
    {
      id: "data-download",
      icon: "download-outline",
      title: "Download Your Data",
      description: "Get a copy of your data",
    },
  ];

  return (
    <SafeScreen>
      <View 
        className="flex-1" 
        style={{ backgroundColor: colors.background }}
      >
        {/* HEADER */}
        <View 
          className="px-6 pb-5 border-b flex-row items-center justify-between"
          style={{ borderColor: colors.glassBorder }}
        >
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <Ionicons name="arrow-back" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ color: colors.text }} className="text-2xl font-bold">Privacy & Security</Text>
          </View>
          <Image 
            source={require("@/assets/images/zaman-logo.png")} 
            className="w-12 h-12 rounded-full"
            resizeMode="contain"
          />
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* SECURITY SETTING */}
          <View className="px-6 pt-6">
            <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">Security</Text>

            {securitySettings.map((setting) => (
              <TouchableOpacity
                key={setting.id}
                className="rounded-2xl p-4 mb-3"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
                activeOpacity={setting.type === "toggle" ? 1 : 0.7}
                disabled={setting.id === "password"} // Excluded
              >
                <View className="flex-row items-center">
                  <View 
                    className="rounded-full w-12 h-12 items-center justify-center mr-4"
                    style={{ backgroundColor: colors.primary + '33' }}
                  >
                    <Ionicons name={setting.icon as any} size={24} color={colors.primary} />
                  </View>

                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="font-bold text-base mb-1">
                      {setting.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm">{setting.description}</Text>
                  </View>

                  {setting.type === "toggle" ? (
                    <Switch
                      value={setting.value}
                      onValueChange={(value) => handleToggle(setting.id, value)}
                      disabled={setting.id === "two-factor"} // Excluded
                      thumbColor="#FFFFFF"
                      trackColor={{ false: isDark ? "#2A2A2A" : "#D1D5DB", true: colors.primary }}
                    />
                  ) : (
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy Section */}
          <View className="px-6 pt-4">
            <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">Privacy</Text>

            {privacySettings.map((setting) => (
              <View key={setting.id}>
                <View 
                  className="rounded-2xl p-4 mb-3"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
                >
                  <View className="flex-row items-center">
                    <View 
                      className="rounded-full w-12 h-12 items-center justify-center mr-4"
                      style={{ backgroundColor: colors.primary + '33' }}
                    >
                      <Ionicons name={setting.icon as any} size={24} color={colors.primary} />
                    </View>
                    <View className="flex-1">
                      <Text style={{ color: colors.text }} className="font-bold text-base mb-1">
                        {setting.title}
                      </Text>
                      <Text style={{ color: colors.textSecondary }} className="text-sm">{setting.description}</Text>
                    </View>
                    <Switch
                      value={setting.value}
                      onValueChange={(value) => handleToggle(setting.id, value)}
                      trackColor={{ false: isDark ? "#2A2A2A" : "#D1D5DB", true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ACCOUNT SECTION */}
          <View className="px-6 pt-4">
            <Text style={{ color: colors.text }} className="text-lg font-bold mb-4">Account</Text>

            {accountSettings.map((setting) => (
              <TouchableOpacity
                key={setting.id}
                className="rounded-2xl p-4 mb-3"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
                activeOpacity={0.7}
                onPress={() => handleAccountAction(setting.id)}
              >
                <View className="flex-row items-center">
                  <View 
                    className="rounded-full w-12 h-12 items-center justify-center mr-4"
                    style={{ backgroundColor: colors.primary + '33' }}
                  >
                    <Ionicons name={setting.icon as any} size={24} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: colors.text }} className="font-bold text-base mb-1">
                      {setting.title}
                    </Text>
                    <Text style={{ color: colors.textSecondary }} className="text-sm">{setting.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* DELETE ACC BTN */}
          <View className="px-6 pt-4">
            <TouchableOpacity
              className="rounded-2xl p-5 flex-row items-center justify-between border-2"
              style={{ backgroundColor: colors.glassSurface, borderColor: 'rgba(239, 68, 68, 0.2)' }}
              activeOpacity={0.7}
              disabled={true} // Excluded
            >
              <View className="flex-row items-center">
                <View className="bg-red-500/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-red-500 font-bold text-base mb-1">Delete Account</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-sm">Permanently delete your account</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>

          {/* INFO ALERT */}
          <View className="px-6 pt-6 pb-4">
            <View 
              className="rounded-2xl p-4 flex-row"
              style={{ backgroundColor: colors.primary + '1A' }}
            >
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={{ color: colors.textSecondary }} className="text-sm ml-3 flex-1">
                We take your privacy seriously. Your data is encrypted and stored securely. You can
                manage your privacy settings at any time.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}

export default PrivacyAndSecurityScreen;
