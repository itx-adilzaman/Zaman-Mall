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

const RegisterScreen = () => {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const tabAnim = useRef(new Animated.Value(0)).current;

  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, text: "", color: "" };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    const strengthLevels = [
      { score: 0, text: "", color: "" },
      { score: 1, text: "Weak", color: "#ef4444" },
      { score: 2, text: "Fair", color: "#f59e0b" },
      { score: 3, text: "Good", color: "#eab308" },
      { score: 4, text: "Strong", color: "#22c55e" },
      { score: 5, text: "Very Strong", color: "#16a34a" }
    ];
    
    return strengthLevels[score];
  };

  const passwordStrength = getPasswordStrength(password);

  useEffect(() => {
    Animated.timing(tabAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      showAlert({
        title: "Error",
        message: "Please fill in all fields",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    if (password !== confirmPassword) {
      showAlert({
        title: "Error",
        message: "Passwords do not match",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    if (password.length < 6) {
      showAlert({
        title: "Error",
        message: "Password must be at least 6 characters",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    setLoading(false);
    
    if (error) {
      showAlert({
        title: "Registration Failed",
        message: error.message,
        icon: "person-add-outline",
        buttons: [{ text: "Try Again", onPress: () => {} }]
      });
    } else {
      showAlert({
        title: "Welcome to Zaman Mall!",
        message: "Account created successfully! Let's complete your profile.",
        icon: "checkmark-circle-outline",
        buttons: [{ 
          text: "Complete Profile", 
          onPress: () => router.replace("/(profile)/edit-profile?first=true") 
        }]
      });
    }
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 200 }} 
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
            <View className="items-center mb-8">
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
                    className="w-20 h-20 rounded-full"
                    resizeMode="contain"
                  />
                </View>
              </View>
              <Text style={{ color: colors.text }} className="text-2xl font-black tracking-tighter mt-3">
                Create Account
              </Text>
              <Text style={{ color: colors.textSecondary }} className="text-sm font-bold tracking-[2px] uppercase mt-1 opacity-60">
                Join Zaman Mall
              </Text>
            </View>

            <View className="w-full gap-4">
              <PremiumTextInput
                label="Full Name"
                icon="person-outline"
                placeholder="John Doe"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

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
                
                {password && (
                  <View className="mt-2">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
                        Password Strength
                      </Text>
                      {passwordStrength.text && (
                        <Text style={{ color: passwordStrength.color }} className="text-xs font-bold">
                          {passwordStrength.text}
                        </Text>
                      )}
                    </View>
                    <View className="flex-row gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <View
                          key={level}
                          className="flex-1 h-1 rounded-full"
                          style={{
                            backgroundColor: level <= passwordStrength.score 
                              ? passwordStrength.color 
                              : colors.border + '40'
                          }}
                        />
                      ))}
                    </View>
                    <Text style={{ color: colors.textSecondary }} className="text-xs mt-2 opacity-70">
                      Use 8+ characters with uppercase, lowercase, numbers & symbols
                    </Text>
                  </View>
                )}
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-2 ml-1">
                  <Text style={{ color: colors.textSecondary }} className="text-xs font-black uppercase tracking-widest">Confirm Password</Text>
                </View>
                <PremiumTextInput
                  icon="lock-closed-outline"
                  rightIcon={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                  onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
              </View>

              <PremiumButton
                title="Create Account"
                colors={isDark ? [colors.primary, '#169c46'] as [string, string] : [colors.primary, '#14a34a'] as [string, string]}
                onPress={handleRegister}
                disabled={loading}
                loading={loading}
                className="mt-4"
              />
            </View>

            <View className="flex-row items-center w-full my-6">
              <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
              <Text style={{ color: colors.textSecondary }} className="mx-4 text-[10px] font-black uppercase tracking-[2px] opacity-40">Or sign up with</Text>
              <View className="flex-1 h-[1px]" style={{ backgroundColor: colors.border }} />
            </View>

            <View className="flex-row gap-4">
              <TouchableOpacity
                activeOpacity={0.7}
                className="flex-1 flex-row items-center justify-center border rounded-2xl py-4"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                onPress={() => showAlert({
                  title: "Coming Soon",
                  message: "Google Sign Up is coming soon!",
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
                  message: "Apple Sign Up is coming soon!",
                  icon: "logo-apple",
                  buttons: [{ text: "OK", onPress: () => {} }]
                })}
              >
                <Image source={require("../../assets/images/apple.png")} className="w-5 h-5 mr-3" resizeMode="contain" />
                <Text style={{ color: colors.text }} className="font-bold">Apple</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: colors.textSecondary }} className="text-center text-[10px] font-bold leading-4 mt-8 px-6 opacity-50">
              By creating an account, you agree to our{"\n"}
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
            activeOpacity={0.8}
            onPress={() => router.replace("/(auth)")}
            className="flex-1 items-center justify-center"
          >
            <Text
              className="text-xs font-black uppercase tracking-[3px]"
              style={{ color: colors.textSecondary }}
            >
              Sign In
            </Text>
          </TouchableOpacity>

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
                Sign Up
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default RegisterScreen;
