import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Platform,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import PremiumButton from "@/components/PremiumButton";
import PremiumTextInput from "@/components/PremiumTextInput";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Common email apps deep links
const EMAIL_APPS = [
  { name: "Gmail",   icon: "📧", url: "googlegmail://",     fallback: "https://mail.google.com" },
  { name: "Outlook", icon: "📨", url: "ms-outlook://",      fallback: "https://outlook.live.com" },
  { name: "Yahoo",   icon: "📬", url: "ymail://",           fallback: "https://mail.yahoo.com" },
  { name: "Email",   icon: "✉️", url: "message://",         fallback: "" },
];

async function openEmailApp() {
  for (const app of EMAIL_APPS) {
    try {
      const canOpen = await Linking.canOpenURL(app.url);
      if (canOpen) {
        await Linking.openURL(app.url);
        return;
      }
    } catch (_) {}
  }
  // Fallback: Gmail web
  await Linking.openURL("https://mail.google.com");
}

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSendReset = async () => {
    if (!email.trim()) {
      showAlert({ title: "Email Zaroor Hai", message: "Apna email address enter karein.", icon: "mail-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      showAlert({ title: "Invalid Email", message: "Sahi email format enter karein.", icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      { redirectTo: "zaman-mall://reset-password" }
    );
    setLoading(false);

    if (error) {
      showAlert({ title: "Error", message: error.message, icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => {} }] });
    } else {
      setSent(true);
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {/* Decorative blobs */}
      <View style={{ position: "absolute", top: -100, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primary + "10" }} />
      <View style={{ position: "absolute", bottom: -80, left: -80, width: 220, height: 220, borderRadius: 110, backgroundColor: colors.primary + "08" }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1 }} className="px-6 pt-14 pb-10">

          {/* Back */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center mb-6"
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View className="items-center mb-8">
            <View style={{ position: "relative", marginBottom: 16 }}>
              <View style={{ position: "absolute", inset: -8, borderRadius: 999, backgroundColor: colors.primary + "1A" }} />
              <View style={{ width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: colors.primary + "50", backgroundColor: colors.glassSurface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Image source={require("@/assets/images/zaman-logo.png")} style={{ width: 76, height: 76, borderRadius: 38 }} resizeMode="contain" />
              </View>
              {/* Lock badge */}
              <View style={{ position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.background }}>
                <Ionicons name="lock-closed" size={13} color="#000" />
              </View>
            </View>

            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 }}>
              Password <Text style={{ color: colors.primary }}>Reset</Text>
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20, opacity: 0.7 }}>
              Email daalein — hum reset link bhej denge
            </Text>
          </View>

          {!sent ? (
            /* ── FORM ── */
            <View style={{ gap: 16 }}>

              {/* Email input card */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 2 }}>
                  Aapka Email
                </Text>
                <PremiumTextInput
                  icon="mail-outline"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Info box */}
              <View style={{ flexDirection: "row", gap: 12, backgroundColor: colors.primary + "0D", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.primary + "20", alignItems: "flex-start" }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Ionicons name="information-circle" size={18} color={colors.primary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, flex: 1 }}>
                  Email mein ek <Text style={{ color: colors.primary, fontWeight: "700" }}>secure reset link</Text> aayega. Link par click karke naya password set karein.
                </Text>
              </View>

              <PremiumButton
                title="Reset Link Bhejo"
                colors={isDark ? ([colors.primary, "#169c46"] as [string, string]) : ([colors.primary, "#14a34a"] as [string, string])}
                onPress={handleSendReset}
                disabled={loading}
                loading={loading}
              />
            </View>

          ) : (
            /* ── SUCCESS STATE ── */
            <View style={{ alignItems: "center", gap: 20 }}>

              {/* Success animation circle */}
              <View style={{ position: "relative", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primary + "10", position: "absolute" }} />
                <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primary + "18", position: "absolute" }} />
                <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="checkmark-circle" size={44} color={colors.primary} />
                </View>
              </View>

              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>Email Bhej Di Gai! ✅</Text>
                <Text style={{ color: colors.textSecondary, textAlign: "center", fontSize: 14, lineHeight: 22, opacity: 0.7, paddingHorizontal: 16 }}>
                  <Text style={{ color: colors.primary, fontWeight: "700" }}>{email}</Text>
                  {"\n"}par reset link bheja gaya hai.{"\n"}
                  Spam folder bhi zaroor check karein.
                </Text>
              </View>

              {/* Open Email App Button */}
              <TouchableOpacity
                onPress={openEmailApp}
                activeOpacity={0.85}
                style={{ width: "100%" }}
              >
                <LinearGradient
                  colors={isDark ? [colors.primary, "#169c46"] : [colors.primary, "#14a34a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: 16, paddingVertical: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 }}
                >
                  <Ionicons name="mail" size={20} color="#000" />
                  <Text style={{ color: "#000", fontSize: 15, fontWeight: "800", letterSpacing: 0.3 }}>
                    Email App Kholo
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={{ flexDirection: "row", alignItems: "center", width: "100%", gap: 12 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", opacity: 0.5 }}>YA</Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              </View>

              {/* Resend + Back row */}
              <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                <TouchableOpacity
                  onPress={() => { setSent(false); setEmail(""); }}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>
                    🔄 Dobara Bhejo
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.replace("/(auth)")}
                  style={{ flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "700" }}>
                    ← Login
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
