import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import SafeScreen from "@/components/SafeScreen";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

const STATS = [
  { label: "Happy Clients", value: "5K+", icon: "people" },
  { label: "Products", value: "1K+", icon: "basket" },
  { label: "Cities", value: "20+", icon: "map" },
];

export default function AboutScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const handleSocialPress = (url: string) => {
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <SafeScreen>
      <ScrollView 
        className="flex-1" 
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="relative h-64 justify-center items-center">
          <LinearGradient
            colors={isDark ? ["rgba(29, 185, 84, 0.2)", "transparent"] : ["rgba(29, 185, 84, 0.1)", "transparent"]}
            className="absolute inset-0"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-6 left-6 w-10 h-10 rounded-full items-center justify-center border z-10"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View className="items-center">
            <View className="relative">
              <View 
                className="absolute inset-0 rounded-full blur-xl scale-125" 
                style={{ backgroundColor: colors.primary + '33' }} // 20% opacity
              />
              <View 
                className="p-1 rounded-full border-2"
                style={{ 
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.primary + '4D' // 30% opacity
                }}
              >
                <Image
                  source={require("@/assets/images/zaman-logo.png")}
                  className="w-24 h-24 rounded-full"
                  contentFit="contain"
                />
              </View>
            </View>
            <Text 
              style={{ color: colors.text }}
              className="text-3xl font-black mt-4 tracking-tighter italic"
            >
              ZAMAN <Text style={{ color: colors.primary }}> MALL </Text>
            </Text>
            <Text 
              style={{ color: colors.textSecondary }}
              className="text-sm font-bold uppercase tracking-[4px]"
            >
              Premium Shopping
            </Text>
          </View>
        </View>

        <View className="px-6 pb-12">
          {/* Our Story */}
          <View 
            className="rounded-[32px] p-6 border shadow-2xl mb-6"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <View className="flex-row items-center mb-4">
              <View 
                className="w-10 h-10 rounded-2xl items-center justify-center mr-3"
                style={{ backgroundColor: colors.primary + '1A' }} // 10% opacity
              >
                <Ionicons name="book-outline" size={20} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text }} className="text-xl font-black italic">OUR STORY</Text>
            </View>
            <Text style={{ color: colors.textSecondary }} className="leading-6 font-medium text-sm">
              Zaman Mall is Pakistan&apos;s premier destination for high-quality electronics, 
              gadgets, and lifestyle products. Founded with a vision to provide authentic 
              products at the best prices, we have grown into a trusted community of 
              tech enthusiasts and savvy shoppers.
            </Text>
          </View>

          {/* Stats Grid */}
          <View className="flex-row gap-3 mb-6">
            {STATS.map((stat, index) => (
              <View 
                key={index} 
                className="flex-1 p-4 rounded-3xl border items-center"
                style={{ 
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder
                }}
              >
                <View 
                  className="p-2.5 rounded-2xl mb-2"
                  style={{ backgroundColor: colors.primary + '1A' }} // 10% opacity
                >
                  <Ionicons name={stat.icon as any} size={18} color={colors.primary} />
                </View>
                <Text style={{ color: colors.text }} className="font-black text-lg">{stat.value}</Text>
                <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold uppercase tracking-wider">
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Why Choose Us */}
          <View 
            className="rounded-[32px] p-6 border shadow-2xl mb-6"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <Text style={{ color: colors.text }} className="text-xl font-black italic mb-6">WHY CHOOSE US?</Text>
            
            <View className="gap-5">
              <View className="flex-row items-start">
                <View 
                  className="p-2 rounded-xl mr-4"
                  style={{ backgroundColor: colors.primary + '33' }} // 20% opacity
                >
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="font-bold text-base mb-1">100% Authentic</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">We guarantee the authenticity of every product we sell.</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View 
                  className="p-2 rounded-xl mr-4"
                  style={{ backgroundColor: colors.primary + '33' }} // 20% opacity
                >
                  <Ionicons name="flash" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="font-bold text-base mb-1">Fast Delivery</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">Quick shipping across Pakistan with real-time tracking.</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View 
                  className="p-2 rounded-xl mr-4"
                  style={{ backgroundColor: colors.primary + '33' }} // 20% opacity
                >
                  <Ionicons name="headset" size={20} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text style={{ color: colors.text }} className="font-bold text-base mb-1">24/7 Support</Text>
                  <Text style={{ color: colors.textSecondary }} className="text-xs leading-5">Our team is always here to help you with your queries.</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Connect With Us */}
          <View 
            className="rounded-[32px] p-6 border shadow-2xl"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <Text style={{ color: colors.text }} className="text-xl font-black italic mb-6">CONNECT WITH US</Text>
            
            <View className="flex-row justify-between px-2">
              <TouchableOpacity 
                onPress={() => handleSocialPress('https://www.facebook.com/share/14XsWy5LpLM/')}
                className="w-14 h-14 rounded-2xl items-center justify-center border"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.glassBorder
                }}
              >
                <Ionicons name="logo-facebook" size={28} color="#1877F2" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleSocialPress('https://www.instagram.com/adilagral?igsh=cWdiYmFlNzdzMDIz')}
                className="w-14 h-14 rounded-2xl items-center justify-center border"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.glassBorder
                }}
              >
                <Ionicons name="logo-instagram" size={28} color="#E4405F" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleSocialPress('https://wa.me/923489054973')}
                className="w-14 h-14 rounded-2xl items-center justify-center border"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.glassBorder
                }}
              >
                <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleSocialPress('https://zamanmall.netlify.app')}
                className="w-14 h-14 rounded-2xl items-center justify-center border"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                  borderColor: colors.glassBorder
                }}
              >
                <Ionicons name="globe-outline" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Version Info */}
          <View className="items-center mt-12 opacity-30">
            <Text style={{ color: colors.text }} className="font-black tracking-[10px] uppercase text-[10px]">ZAMAN MALL</Text>
            <Text style={{ color: colors.textSecondary }} className="text-[8px] mt-2 font-bold uppercase tracking-widest">Version 2.0.0 Premium</Text>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

