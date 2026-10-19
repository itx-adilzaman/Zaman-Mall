import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { BlurView } from "expo-blur";
import SafeScreen from "@/components/SafeScreen";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

export default function OrderSuccessScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { orderId, paymentMethod, paymentStatus } = useLocalSearchParams<{
    orderId: string;
    paymentMethod?: string;
    paymentStatus?: string;
  }>();

  const isOnlinePayment = paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash';
  const isPendingApproval = paymentStatus === 'awaiting_approval';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeScreen>
      <View className="flex-1" style={{ backgroundColor: isDark ? "#010409" : colors.background }}>
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* SUCCESS HEADER */}
          <View className="relative h-96 justify-center items-center overflow-hidden">
            <LinearGradient
              colors={isDark 
                ? ["rgba(16, 185, 129, 0.2)", "rgba(37, 99, 235, 0.1)", "transparent"] 
                : ["rgba(16, 185, 129, 0.1)", "rgba(37, 99, 235, 0.05)", "transparent"]
              }
              className="absolute inset-0"
            />
            
            <Animated.View 
              style={{ 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
                alignItems: 'center'
              }}
              className="px-6"
            >
              <View className="relative mb-8">
                <View 
                  className="absolute inset-0 rounded-[50px] blur-3xl scale-150" 
                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)' }}
                />
                <View 
                  className="w-32 h-32 rounded-[45px] items-center justify-center border-2 shadow-2xl"
                  style={{ 
                    backgroundColor: colors.glassSurface,
                    borderColor: isPendingApproval ? 'rgba(245,158,11,0.4)' : 'rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <LinearGradient
                    colors={isPendingApproval ? ['#F59E0B', '#D97706'] : ['#10B981', '#059669']}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={isPendingApproval ? 'time-outline' : 'checkmark-done'} size={44} color="#000" />
                  </LinearGradient>
                </View>
              </View>

              <Text 
                style={{ color: colors.text }}
                className="text-4xl font-black tracking-tighter italic text-center leading-none"
              >
                {isPendingApproval ? 'ORDER' : 'ORDER'}{' '}
                <Text style={{ color: isPendingApproval ? '#F59E0B' : '#10B981' }}>
                  {isPendingApproval ? 'RECEIVED!' : 'SUCCESSFUL'}
                </Text>
              </Text>
              <Text 
                style={{ color: colors.textSecondary }}
                className="text-[10px] font-black uppercase tracking-[8px] mt-4 text-center"
              >
                {isPendingApproval ? 'Awaiting Payment Approval' : 'Confirmed'}
              </Text>
              {orderId && (
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' }} className="text-[9px] font-black uppercase tracking-widest mt-2 text-center">
                  ID: {orderId}
                </Text>
              )}
            </Animated.View>
          </View>

          <Animated.View 
            className="px-6 -mt-12"
            style={{ opacity: fadeAnim }}
          >
            {/* PAYMENT PENDING INFO — only for EasyPaisa/JazzCash */}
            {isPendingApproval && (
              <View
                style={{
                  borderRadius: 28, padding: 20, borderWidth: 1,
                  borderColor: 'rgba(245,158,11,0.3)',
                  backgroundColor: 'rgba(245,158,11,0.08)',
                  marginBottom: 16,
                  flexDirection: 'row', gap: 14, alignItems: 'flex-start',
                }}
              >
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(245,158,11,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="time-outline" size={24} color="#F59E0B" />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Payment Verification Pending
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', fontSize: 12, lineHeight: 18 }}>
                    {paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} receipt Adil Zaman 1-2 ghante mein verify karein ge. Payment approve hone ke baad order automatically active ho jaye ga.
                  </Text>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: 11, marginTop: 4 }}>
                    "My Orders" mein payment status check kar sakte hain
                  </Text>
                </View>
              </View>
            )}

            {/* TERMS AND CONDITIONS CARD */}
            <View 
              className="rounded-[50px] p-8 border shadow-2xl mb-8 overflow-hidden"
              style={{ 
                backgroundColor: colors.glassSurface,
                borderColor: colors.glassBorder,
              }}
            >
              <BlurView intensity={isDark ? 40 : 60} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
              
              <View className="flex-row items-center mb-6">
                <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                <Text style={{ color: colors.text }} className="text-xl font-black italic ml-3">TERMS & CONDITIONS</Text>
              </View>

              <View className="space-y-4">
                <View className="flex-row items-start">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3" />
                  <Text style={{ color: colors.textSecondary }} className="flex-1 text-xs font-medium leading-5">
                    Your order has been logged into our primary logistics terminal and will be processed within 24 standard earth hours.
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3" />
                  <Text style={{ color: colors.textSecondary }} className="flex-1 text-xs font-medium leading-5">
                    Cancellations are only permitted within the first 2 hours of signal transmission.
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3" />
                  <Text style={{ color: colors.textSecondary }} className="flex-1 text-xs font-medium leading-5">
                    Royal returns are valid for 7 days if the imperial seal (packaging) remains intact.
                  </Text>
                </View>

                <View className="flex-row items-start">
                  <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 mr-3" />
                  <Text style={{ color: colors.textSecondary }} className="flex-1 text-xs font-medium leading-5">
                    Shipping protocols depend on your geographic coordinates (usually 3-5 business days).
                  </Text>
                </View>
              </View>
            </View>

            {/* ACTION BUTTONS */}
            <View className="gap-4">
              <TouchableOpacity
                onPress={() => {
                  // Push instead of replace — back button kaam kare
                  router.push('/(profile)/orders');
                }}
                className="w-full h-16 rounded-[24px] overflow-hidden shadow-xl"
              >
                <LinearGradient
                  colors={isPendingApproval ? ['#F59E0B', '#D97706'] : [colors.primary, colors.primary + 'CC']}
                  className="flex-1 items-center justify-center flex-row"
                  style={{ gap: 10 }}
                >
                  <Ionicons name={isPendingApproval ? 'time-outline' : 'list'} size={20} color="#000" />
                  <Text style={{ color: '#000' }} className="font-black text-[11px] uppercase tracking-[4px]">
                    {isPendingApproval ? 'Check Payment Status' : 'Track My Order'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/(tabs)')}
                className="w-full h-16 rounded-[24px] items-center justify-center border"
                style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder }}
              >
                <Text style={{ color: colors.text }} className="font-black text-[11px] uppercase tracking-[4px]">Back to Mall</Text>
              </TouchableOpacity>
            </View>

            {/* FOOTER */}
            <View className="items-center py-10 opacity-30">
              <Text style={{ color: colors.text }} className="font-black tracking-[12px] uppercase text-[10px]">ZAMAN MALL</Text>
              <Text style={{ color: colors.textSecondary }} className="text-[8px] mt-4 font-black uppercase tracking-widest text-center">Secure Transaction Node © 2026</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    </SafeScreen>
  );
}
