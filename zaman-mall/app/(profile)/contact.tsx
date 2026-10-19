import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import SafeScreen from "@/components/SafeScreen";
import { useTheme } from "@/context/ThemeContext";
import PremiumTextInput from "@/components/PremiumTextInput";
import PremiumButton from "@/components/PremiumButton";
import { useAlert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

export default function ContactScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const { user } = useAuth();

  const [name, setName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("General Inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!name || !email || !message) {
      showAlert({
        title: "Incomplete Request",
        message: "Please provide all details to proceed with your premium support request.",
        icon: "alert-circle-outline",
        buttons: [{ text: "Understood", onPress: () => {} }]
      });
      return;
    }

    setLoading(true);
    try {
      // Execute transmission exactly like website (using 'messages' table)
      const { error } = await supabase
        .from('messages')
        .insert([
          { 
            id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
            name, 
            email, 
            subject,
            message, 
            user_id: user?.id || null,
            read: false,
            reply_read_by_user: true,
            date: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      } else {
        setIsSubmitted(true);
        showAlert({
          title: "Signal Received",
          message: "The neural link is active. Your inquiry has been cached in our primary terminal and routed to our executive curators.",
          icon: "checkmark-circle-outline",
          buttons: [{ text: "Excellent", onPress: () => router.back() }]
        });
      }
    } catch (err: any) {
      console.error("Transmission Error:", err);
      showAlert({
        title: "Transmission Failed",
        message: "Unable to establish secure connection. Please check your network protocol.",
        icon: "alert-circle-outline",
        buttons: [{ text: "Retry", onPress: () => {} }]
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        style={{ backgroundColor: isDark ? "#010409" : colors.background }}
      >
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* ROYAL HEADER */}
          <View className="relative h-96 justify-center items-center overflow-hidden">
            <LinearGradient
              colors={isDark 
                ? ["rgba(37, 99, 235, 0.2)", "rgba(147, 51, 234, 0.1)", "transparent"] 
                : ["rgba(37, 99, 235, 0.1)", "rgba(147, 51, 234, 0.05)", "transparent"]
              }
              className="absolute inset-0"
            />
            
            {/* Dynamic Atmospheric Circles */}
            <View 
              style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
              }}
            />

            <TouchableOpacity
              onPress={() => router.back()}
              className="absolute top-6 left-6 w-12 h-12 rounded-2xl items-center justify-center border z-20"
              style={{ 
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5
              }}
            >
              <Ionicons name="chevron-back" size={26} color={colors.text} />
            </TouchableOpacity>

            <Animated.View 
              style={{ 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                alignItems: 'center'
              }}
              className="px-6"
            >
              <View className="relative mb-8">
                <View 
                  className="absolute inset-0 rounded-[50px] blur-3xl scale-150" 
                  style={{ backgroundColor: 'rgba(37, 99, 235, 0.3)' }}
                />
                <View 
                  className="w-28 h-28 rounded-[40px] items-center justify-center border-2 shadow-2xl"
                  style={{ 
                    backgroundColor: colors.glassSurface,
                    borderColor: 'rgba(37, 99, 235, 0.4)',
                  }}
                >
                  <LinearGradient
                    colors={['#2563EB', '#9333EA']}
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 24,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="flash" size={36} color="#FFF" />
                  </LinearGradient>
                </View>
              </View>

              <Text 
                style={{ color: colors.text }}
                className="text-5xl font-black tracking-tighter italic text-center leading-none"
              >
                ESTABLISH <Text style={{ color: '#3B82F6' }}>CONNECTION</Text>
              </Text>
              <View className="flex-row items-center mt-4">
                <View className="h-[1px] w-12 bg-blue-500/30" />
                <Text 
                  style={{ color: colors.textSecondary }}
                  className="text-[10px] font-black uppercase tracking-[8px] mx-4"
                >
                  Terminal Active
                </Text>
                <View className="h-[1px] w-12 bg-blue-500/30" />
              </View>
            </Animated.View>
          </View>

          <Animated.View 
            className="px-6 -mt-12"
            style={{ 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }}
          >
            {/* TERMINAL CARD */}
            <View 
              className="rounded-[50px] p-10 border shadow-2xl mb-10 overflow-hidden"
              style={{ 
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
              }}
            >
              <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              
              <View className="flex-row justify-between items-center mb-10">
                <View>
                  <Text style={{ color: colors.text }} className="text-2xl font-black italic">INQUIRY TERMINAL</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] font-black uppercase tracking-[4px] mt-1 opacity-50">Node: SUP-APP-01</Text>
                </View>
                <View 
                  className="px-4 py-2 rounded-full border border-blue-500/20 bg-blue-500/5 flex-row items-center"
                >
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2 animate-pulse" />
                  <Text className="text-blue-500 text-[8px] font-black uppercase tracking-widest">Verified</Text>
                </View>
              </View>
              
              <View className="gap-6">
                <PremiumTextInput
                  label="Identity Alias"
                  placeholder="Your Full Name"
                  icon="person-outline"
                  value={name}
                  onChangeText={setName}
                />

                <PremiumTextInput
                  label="Neural Link"
                  placeholder="Email Address"
                  icon="at-outline"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />

                <View className="mb-2">
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] font-black mb-3 ml-2 uppercase tracking-[3px]">
                    Frequency (Subject)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                    {["General Inquiry", "Order Support", "Wholesale", "Tech Issue"].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSubject(s)}
                        className={`px-6 py-3 rounded-2xl mr-3 border ${subject === s ? 'bg-blue-600/20 border-blue-500/40' : 'bg-white/5 border-white/10'}`}
                      >
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${subject === s ? 'text-blue-400' : 'text-gray-500'}`}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View className="mb-10">
                  <Text style={{ color: colors.textSecondary }} className="text-[9px] font-black mb-3 ml-2 uppercase tracking-[3px]">
                    Signal Content
                  </Text>
                  <View
                    className="overflow-hidden border"
                    style={{
                      backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                      borderColor: colors.glassBorder,
                      borderRadius: 32,
                      minHeight: 180,
                    }}
                  >
                    <PremiumTextInput
                      placeholder="Type your transmission here..."
                      multiline
                      numberOfLines={8}
                      style={{ 
                        textAlignVertical: 'top', 
                        height: 160,
                        paddingTop: 20,
                        fontSize: 16,
                        fontWeight: '600',
                        color: colors.text
                      }}
                      containerClassName="mb-0 border-0"
                      value={message}
                      onChangeText={setMessage}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={loading}
                  className="w-full h-20 rounded-[30px] overflow-hidden shadow-2xl"
                >
                  <LinearGradient
                    colors={['#2563EB', '#1D4ED8']}
                    className="flex-1 items-center justify-center flex-row"
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Text className="text-white font-black text-sm uppercase tracking-[5px] mr-4">SEND SIGNAL</Text>
                        <Ionicons name="paper-plane" size={20} color="#FFF" />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* CHANNELS GRID */}
            <View className="flex-row gap-4 mb-12">
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://wa.me/923489054973')}
                activeOpacity={0.8}
                className="flex-1 p-8 rounded-[40px] border items-center justify-center"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
              >
                <View className="w-16 h-16 rounded-3xl bg-green-500/10 items-center justify-center mb-4">
                  <Ionicons name="logo-whatsapp" size={28} color="#22C55E" />
                </View>
                <Text style={{ color: colors.text }} className="font-black text-[10px] uppercase tracking-widest text-center">Secure WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => Linking.openURL('tel:+923345866715')}
                className="flex-1 p-8 rounded-[40px] border items-center justify-center"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
              >
                <View className="w-16 h-16 rounded-3xl bg-blue-500/10 items-center justify-center mb-4">
                  <Ionicons name="call" size={28} color="#3B82F6" />
                </View>
                <Text style={{ color: colors.text }} className="font-black text-[10px] uppercase tracking-widest text-center">Voice Terminal</Text>
              </TouchableOpacity>
            </View>

            {/* ENCRYPTION BADGE */}
            <View 
              className="p-8 rounded-[40px] border border-blue-500/20 bg-blue-500/5 flex-row items-center mb-12"
            >
              <Ionicons name="shield-checkmark" size={32} color="#3B82F6" />
              <View className="flex-1 ml-6">
                <Text className="text-white font-black text-xs uppercase tracking-widest mb-1">Encryption Verified</Text>
                <Text className="text-gray-500 text-[10px] leading-relaxed font-medium italic">Signals are dispatched via the Zaman Sons Sovereign API Terminal.</Text>
              </View>
            </View>

            {/* SOCIAL MEDIA SECTION */}
            <View className="mb-12">
              <Text style={{ color: colors.text }} className="text-center font-black italic text-lg mb-8 uppercase tracking-[3px]">Imperial Socials</Text>
              <View className="flex-row justify-center gap-6">
                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://www.facebook.com/share/14XsWy5LpLM/')}
                  className="w-16 h-16 rounded-3xl items-center justify-center border shadow-2xl"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                >
                  <Ionicons name="logo-facebook" size={30} color="#1877F2" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://www.instagram.com/adilagral?igsh=cWdiYmFlNzdzMDIz')}
                  className="w-16 h-16 rounded-3xl items-center justify-center border shadow-2xl"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                >
                  <Ionicons name="logo-instagram" size={30} color="#E4405F" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://zamanmall.netlify.app')}
                  className="w-16 h-16 rounded-3xl items-center justify-center border shadow-2xl"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                >
                  <Ionicons name="globe-outline" size={30} color="#3B82F6" />
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://wa.me/923489054973')}
                  className="w-16 h-16 rounded-3xl items-center justify-center border shadow-2xl"
                  style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
                >
                  <Ionicons name="logo-whatsapp" size={30} color="#22C55E" />
                </TouchableOpacity>
              </View>
            </View>

            {/* FOOTER */}
            <View className="items-center py-10 opacity-30">
              <Text style={{ color: colors.text }} className="font-black tracking-[15px] uppercase text-[12px]">ZAMAN MALL</Text>
              <Text style={{ color: colors.textSecondary }} className="text-[10px] mt-4 font-black uppercase tracking-widest text-center">Protocol Node: SUP-APP-01 © 2026</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}
