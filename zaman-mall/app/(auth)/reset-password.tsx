import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Dimensions,
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

const { width: SCREEN_W } = Dimensions.get("window");

export default function ResetPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Session state
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
    ]).start();
  }, []);

  // ── Wait for PASSWORD_RECOVERY session ───────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
        return;
      }

      const timer = setTimeout(() => setSessionError(true), 15000);

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          clearTimeout(timer);
          setSessionReady(true);
        }
      });

      return () => {
        clearTimeout(timer);
        subscription.unsubscribe();
      };
    });
  }, []);

  const getStrength = (pw: string) => {
    if (!pw) return { score: 0, text: "", color: "" };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pw)) score++;
    const levels = [
      { score: 0, text: "", color: "" },
      { score: 1, text: "Kamzor", color: "#ef4444" },
      { score: 2, text: "Theek Hai", color: "#f59e0b" },
      { score: 3, text: "Acha", color: "#eab308" },
      { score: 4, text: "Mazboot", color: "#22c55e" },
      { score: 5, text: "Bahut Mazboot", color: "#16a34a" },
    ];
    return levels[score];
  };

  const strength = getStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = password.length >= 6 && passwordsMatch && !loading && sessionReady;

  const handleReset = async () => {
    if (!sessionReady) {
      showAlert({ title: "Link Expire Ho Gaya", message: "Reset link expire ho gayi hai. Dobara Forgot Password use karein.", icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => router.replace("/(auth)/forgot-password") }] });
      return;
    }
    if (!password || !confirmPassword) {
      showAlert({ title: "Fields Khaali Hain", message: "Dono fields bharein.", icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }
    if (password.length < 6) {
      showAlert({ title: "Password Chota Hai", message: "Kam az kam 6 characters ka password chahiye.", icon: "lock-closed-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }
    if (password !== confirmPassword) {
      showAlert({ title: "Password Match Nahi", message: "Dono passwords ek jaise hone chahiye.", icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      const isSessionErr = error.message.toLowerCase().includes("session") || error.message.toLowerCase().includes("not authenticated");
      showAlert({
        title: isSessionErr ? "Link Expire Ho Gayi" : "Error",
        message: isSessionErr ? "Reset link expire ho gayi ya use ho chuki hai. Dobara request karein." : error.message,
        icon: "alert-circle-outline",
        buttons: [{ text: isSessionErr ? "Dobara Try Karein" : "OK", onPress: () => isSessionErr ? router.replace("/(auth)/forgot-password") : {} }],
      });
    } else {
      await supabase.auth.signOut();
      setDone(true);
    }
  };

  // ── Loading State ─────────────────────────────────────────────────────────
  if (!sessionReady && !sessionError) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", gap: 20 }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + "15", alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        <View style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>Link Verify Ho Rahi Hai...</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13, opacity: 0.6 }}>Thodi der wait karein</Text>
        </View>
      </View>
    );
  }

  // ── Session Expired ───────────────────────────────────────────────────────
  if (sessionError && !sessionReady) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 24 }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "#ef444412", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#ef444430" }}>
          <Ionicons name="alert-circle" size={48} color="#ef4444" />
        </View>
        <View style={{ alignItems: "center", gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>Link Expire Ho Gayi ⏰</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, opacity: 0.65 }}>
            Reset link expire ho gayi ya already use ho chuki hai.{"\n"}Dobara request karein.
          </Text>
        </View>
        <PremiumButton
          title="Dobara Reset Request Karein"
          colors={isDark ? ([colors.primary, "#169c46"] as [string, string]) : ([colors.primary, "#14a34a"] as [string, string])}
          onPress={() => router.replace("/(auth)/forgot-password")}
          style={{ width: SCREEN_W - 56 }}
        />
      </View>
    );
  }

  // ── Main Screen ───────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Bg blobs */}
      <View style={{ position: "absolute", top: -120, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: colors.primary + "0D" }} />
      <View style={{ position: "absolute", bottom: -100, left: -80, width: 240, height: 240, borderRadius: 120, backgroundColor: colors.primary + "08" }} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], flex: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 24 }}>

          {/* Back button */}
          {!done && (
            <TouchableOpacity
              onPress={() => router.replace("/(auth)")}
              style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", marginBottom: 28 }}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={18} color={colors.text} />
            </TouchableOpacity>
          )}

          {/* Logo + Title */}
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ position: "relative", marginBottom: 18 }}>
              <View style={{ position: "absolute", inset: -10, borderRadius: 999, backgroundColor: colors.primary + "12" }} />
              <View style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primary + "45", backgroundColor: colors.glassSurface, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <Image source={require("@/assets/images/zaman-logo.png")} style={{ width: 78, height: 78, borderRadius: 39 }} resizeMode="contain" />
              </View>
              {/* Badge */}
              <View style={{ position: "absolute", bottom: -2, right: -2, width: 30, height: 30, borderRadius: 15, backgroundColor: done ? colors.primary : "#f59e0b", alignItems: "center", justifyContent: "center", borderWidth: 2.5, borderColor: colors.background, elevation: 4 }}>
                <Ionicons name={done ? "checkmark" : "key"} size={14} color="#000" />
              </View>
            </View>

            <Text style={{ color: colors.text, fontSize: 26, fontWeight: "900", letterSpacing: -0.5, marginBottom: 6 }}>
              {done ? "Password " : "Naya "}<Text style={{ color: colors.primary }}>{done ? "Reset!" : "Password"}</Text>
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", opacity: 0.65, lineHeight: 20 }}>
              {done ? "Successfully update ho gaya hai" : "Apna naya mazboot password set karein"}
            </Text>
          </View>

          {!done ? (
            /* ══ FORM ══════════════════════════════════════════════════════ */
            <View style={{ gap: 14 }}>

              {/* Session verified badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.primary + "0D", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1, borderColor: colors.primary + "20" }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
                </View>
                <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700", flex: 1 }}>
                  Identity verify ho gayi ✓
                </Text>
              </View>

              {/* Password fields card */}
              <View style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 20 }}>

                {/* New password */}
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 4 }}>
                    Naya Password
                  </Text>
                  <PremiumTextInput
                    icon="lock-closed-outline"
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    placeholder="••••••••"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <View style={{ gap: 6, paddingHorizontal: 4 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>Password Strength</Text>
                        {strength.text && <Text style={{ color: strength.color, fontSize: 11, fontWeight: "800" }}>{strength.text}</Text>}
                      </View>
                      <View style={{ flexDirection: "row", gap: 5 }}>
                        {[1, 2, 3, 4, 5].map((l) => (
                          <View key={l} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: l <= strength.score ? strength.color : colors.border + "60" }} />
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: colors.border + "60" }} />

                {/* Confirm password */}
                <View style={{ gap: 8 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 4 }}>
                    Confirm Password
                  </Text>
                  <PremiumTextInput
                    icon="lock-closed-outline"
                    rightIcon={showConfirm ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowConfirm(!showConfirm)}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  {confirmPassword.length > 0 && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 4 }}>
                      <Ionicons
                        name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                        size={15}
                        color={passwordsMatch ? "#22c55e" : "#ef4444"}
                      />
                      <Text style={{ color: passwordsMatch ? "#22c55e" : "#ef4444", fontSize: 12, fontWeight: "700" }}>
                        {passwordsMatch ? "Passwords match ✓" : "Passwords match nahi kar rahe"}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Submit Button — full width */}
              <TouchableOpacity
                onPress={handleReset}
                disabled={!canSubmit}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canSubmit
                    ? (isDark ? [colors.primary, "#169c46"] : [colors.primary, "#14a34a"])
                    : [colors.border, colors.border]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 56,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                    opacity: canSubmit ? 1 : 0.5,
                    shadowColor: colors.primary,
                    shadowOpacity: canSubmit ? 0.4 : 0,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: canSubmit ? 6 : 0,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark-outline" size={20} color={canSubmit ? "#000" : colors.textSecondary} />
                      <Text style={{ color: canSubmit ? "#000" : colors.textSecondary, fontSize: 15, fontWeight: "800", letterSpacing: 0.5 }}>
                        Password Update Karein
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

            </View>

          ) : (
            /* ══ SUCCESS ═══════════════════════════════════════════════════ */
            <View style={{ alignItems: "center", gap: 24 }}>

              {/* Success ring */}
              <View style={{ alignItems: "center", justifyContent: "center", width: 120, height: 120 }}>
                <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primary + "08" }} />
                <View style={{ position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primary + "12" }} />
                <View style={{ width: 74, height: 74, borderRadius: 37, backgroundColor: colors.primary + "20", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="shield-checkmark" size={42} color={colors.primary} />
                </View>
              </View>

              {/* Text */}
              <View style={{ alignItems: "center", gap: 10, paddingHorizontal: 8 }}>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900", textAlign: "center" }}>
                  Password Reset Ho Gaya! 🎉
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22, opacity: 0.65 }}>
                  Aapka naya password set ho gaya.{"\n"}Ab login karein.
                </Text>
              </View>

              {/* Security tips */}
              <View style={{ width: "100%", backgroundColor: colors.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 }}>
                  🔒 Security Tips
                </Text>
                {[
                  "Naya password kisi ko mat batayein",
                  "Har website par alag password rakhein",
                  "Zaman Mall kabhi password nahi poochega",
                ].map((tip, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 6, flexShrink: 0 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 20, opacity: 0.8 }}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Login Button — full width */}
              <TouchableOpacity
                onPress={() => router.replace("/(auth)")}
                activeOpacity={0.85}
                style={{ width: "100%" }}
              >
                <LinearGradient
                  colors={isDark ? [colors.primary, "#169c46"] : [colors.primary, "#14a34a"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 56,
                    borderRadius: 18,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 10,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 6,
                  }}
                >
                  <Ionicons name="log-in-outline" size={20} color="#000" />
                  <Text style={{ color: "#000", fontSize: 15, fontWeight: "800", letterSpacing: 0.5 }}>
                    Login Karein
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

            </View>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}
