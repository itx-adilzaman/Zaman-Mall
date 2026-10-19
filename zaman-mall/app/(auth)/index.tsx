import { View, Text, Image, TouchableOpacity, ActivityIndicator, TextInput, ScrollView, Dimensions, Animated } from "react-native";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import PremiumButton from "@/components/PremiumButton";
import PremiumTextInput from "@/components/PremiumTextInput";

const { width } = Dimensions.get("window");

const AuthScreen = () => {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert({
        title: "Error",
        message: "Please enter email and password",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      showAlert({
        title: "Login Failed",
        message: error.message,
        icon: "lock-closed-outline",
        buttons: [{ text: "Try Again", onPress: () => {} }]
      });
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160 }} 
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 relative">
          {/* Decorative Background Elements */}
          <View 
            className="absolute top-[-100] right-[-50] w-[300] h-[300] rounded-full blur-[100px]" 
            style={{ backgroundColor: colors.primary + '1A' }}
          />
          <View 
            className="absolute bottom-[-50] left-[-100] w-[300] h-[300] rounded-full blur-[80px]" 
            style={{ backgroundColor: colors.primary + '0D' }}
          />

          <View className="px-8 pt-20 pb-10 flex-1">
            {/* LOGO BRANDING */}
            <View className="items-center mb-10">
              <View className="relative">
                <View 
                  className="absolute inset-0 rounded-full blur-xl scale-125" 
                  style={{ backgroundColor: colors.primary + '33' }}
                />
                <View 
                  className="p-1 rounded-full border-2 shadow-2xl"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.primary + '4D', shadowColor: colors.primary }}
                >
                  <Image
                    source={require("@/assets/images/zaman-logo.png")}
                    className="w-24 h-24 rounded-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={{ color: colors.text }} className="text-3xl font-black tracking-tighter mt-4">
                Zaman <Text style={{ color: colors.primary }}>Mall</Text>
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm font-bold tracking-[4px] uppercase mt-1 opacity-60">
                Premium Shopping
              </Text>
            </View>

            <View className="w-full gap-5">
              <PremiumTextInput
                label="Email Address"
                icon="mail-outline"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <View>
                <View className="flex-row justify-between items-center mb-2 ml-1">
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-black uppercase tracking-widest">Password</Text>
                  <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
                    <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase tracking-widest">Forgot?</Text>
                  </TouchableOpacity>
                </View>
                <PremiumTextInput
                  icon="lock-closed-outline"
                  rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowPassword(!showPassword)}
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
              </View>

              <PremiumButton
                title="Sign In"
                colors={isDark ? [colors.primary, '#169c46'] as [string, string] : [colors.primary, '#14a34a'] as [string, string]}
                onPress={handleLogin}
                disabled={loading}
                loading={loading}
                className="mt-4"
              />
            </View>

            <View className="flex-row items-center w-full my-8">
              <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
              <Text style={{ color: colors.textSecondary }} className="mx-4 text-[10px] font-black uppercase tracking-[2px] opacity-40">Quick Access</Text>
              <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center border rounded-2xl py-4"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                onPress={() => showAlert({
                  title: "Coming Soon",
                  message: "Google Sign In is coming soon!",
                  icon: "logo-google",
                  buttons: [{ text: "OK", onPress: () => {} }]
                })}
              >
                <Image source={require("../../assets/images/google.png")} className="w-5 h-5 mr-3" resizeMode="contain" />
                <Text style={{ color: colors.text }} className="font-bold">Google</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center border rounded-2xl py-4"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                onPress={() => showAlert({
                  title: "Coming Soon",
                  message: "Apple Sign In is coming soon!",
                  icon: "logo-apple",
                  buttons: [{ text: "OK", onPress: () => {} }]
                })}
              >
                <Image source={require("../../assets/images/apple.png")} className="w-5 h-5 mr-3" resizeMode="contain" />
                <Text style={{ color: colors.text }} className="font-bold">Apple</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary }} className="text-center text-[10px] font-bold leading-4 mt-10 px-6 opacity-50">
              By continuing, you agree to our{"\n"}
              <Text style={{ color: colors.primary }}>Terms of Service</Text> & <Text style={{ color: colors.primary }}>Privacy Policy</Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      <Animated.View
        style={{
          opacity: tabAnim,
          transform: [
            {
              translateY: tabAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
          position: "absolute",
          left: 24,
          right: 24,
          bottom: 32,
        }}
      >
        <View
          className="flex-row items-center rounded-full border px-2 py-2"
          style={{
            borderColor: colors.glassBorder,
            backgroundColor: isDark ? "rgba(15,23,42,0.96)" : "rgba(15,118,110,0.18)",
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1"
          >
            <LinearGradient
              colors={isDark ? [colors.primary, "#16a34a"] : [colors.primary, "#22c55e"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 999,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: colors.primary,
                shadowOpacity: 0.5,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text className="text-xs font-black uppercase tracking-[3px]" style={{ color: "#000" }}>
                Sign In
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.replace("/(auth)/register")}
            className="flex-1 items-center justify-center"
          >
            <Text
              className="text-xs font-black uppercase tracking-[3px]"
              style={{ color: colors.textSecondary }}
            >
              Sign Up
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default AuthScreen;
