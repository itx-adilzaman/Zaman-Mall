import SafeScreen from "@/components/SafeScreen";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Alert, Animated, StyleSheet, Linking, Modal } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { Href, router, useFocusEffect } from "expo-router";
import { useCallback, useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AIChatModal from "@/components/AIChatModal";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import PremiumButton from "@/components/PremiumButton";
import LottieView from "lottie-react-native";

// ── Coming Soon Section ───────────────────────────────────────────────────────
const ComingSoonSection = ({ colors, isDark }: { colors: any; isDark: boolean }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

  const FEATURES = [
    { icon: '🏪', title: 'Apni Shop Kholein', desc: 'Ghar baithe apni online dukaan shuru karein — bilkul free' },
    { icon: '📦', title: 'Product Management', desc: 'Unlimited products add karein, prices set karein, stock manage karein' },
    { icon: '💰', title: 'Direct Payments', desc: 'Payments seedha aapke account mein — koi delay nahi' },
    { icon: '📊', title: 'Sales Analytics', desc: 'Real-time sales graphs aur customer insights dekhein' },
    { icon: '🚚', title: 'Delivery Network', desc: 'Zaman Mall ka delivery network use karein — Pakistan mein kahin bhi' },
    { icon: '⭐', title: 'Seller Ratings', desc: 'Customers se reviews aur ratings hasil karein' },
    { icon: '📱', title: 'Mobile Dashboard', desc: 'Phone se hi sab manage karein — 24/7' },
    { icon: '🎯', title: 'Marketing Tools', desc: 'Promotions, coupons aur flash sales run karein' },
  ];

  return (
    <>
      {/* ── Card ── */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginHorizontal: 24, marginBottom: 20 }}>
        <TouchableOpacity activeOpacity={0.88} onPress={() => setModalVisible(true)}>
          <LinearGradient
            colors={isDark
              ? ['#0d1f0d', '#0a0a1a', '#1a0d2e']
              : ['#f0fdf4', '#eff6ff', '#fdf4ff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28, padding: 22,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(139,92,246,0.3)' : 'rgba(139,92,246,0.2)',
              overflow: 'hidden',
            }}
          >
            {/* Glow blob */}
            <Animated.View style={{
              position: 'absolute', top: -40, right: -40,
              width: 160, height: 160, borderRadius: 80,
              backgroundColor: '#8B5CF6',
              opacity: glowOpacity,
            }} />
            <Animated.View style={{
              position: 'absolute', bottom: -30, left: -30,
              width: 120, height: 120, borderRadius: 60,
              backgroundColor: '#1DB954',
              opacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.35] }),
            }} />

            {/* Coming soon badge */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)',
              borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
              borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
              alignSelf: 'flex-start', marginBottom: 14,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#8B5CF6' }} />
              <Text style={{ color: '#8B5CF6', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Coming Soon
              </Text>
            </View>

            {/* Title */}
            <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 }}>
              Zaman Mall{'\n'}
              <Text style={{ color: '#8B5CF6' }}>Multi Vendor</Text>{' '}
              <Text style={{ color: '#1DB954' }}>Platform</Text>
            </Text>

            <Text style={{ color: isDark ? 'rgba(255,255,255,0.6)' : '#475569', fontSize: 13, lineHeight: 20, marginBottom: 18 }}>
              Pakistan mein apni online dukaan kholein — Zaman Mall Seller Center par. Millions of customers tak reach karein.
            </Text>

            {/* Mini feature pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
              {['Free Registration', 'Mobile App', 'Fast Payments', 'Analytics'].map((f, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 4,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                }}>
                  <Ionicons name="checkmark-circle" size={11} color="#1DB954" />
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: 11, fontWeight: '700' }}>{f}</Text>
                </View>
              ))}
            </View>

            {/* CTA Row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {['🏪', '💰', '📊', '📱'].map((e, i) => (
                  <View key={i} style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Text style={{ fontSize: 15 }}>{e}</Text>
                  </View>
                ))}
              </View>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: '#8B5CF6', borderRadius: 16,
                paddingHorizontal: 14, paddingVertical: 9,
                shadowColor: '#8B5CF6', shadowOpacity: 0.4,
                shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
              }}>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Learn More</Text>
                <Ionicons name="arrow-forward" size={13} color="#fff" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Detail Modal ── */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
          <BlurView intensity={isDark ? 40 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={{
            backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
            borderTopLeftRadius: 36, borderTopRightRadius: 36,
            maxHeight: '92%', overflow: 'hidden',
            borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}>
            {/* Modal Header Gradient */}
            <LinearGradient
              colors={['#4F46E5', '#8B5CF6', '#1DB954']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ paddingTop: 36, paddingBottom: 28, paddingHorizontal: 24, alignItems: 'center', position: 'relative', overflow: 'hidden' }}
            >
              {/* Decor */}
              <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.06)' }} />
              <View style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.04)' }} />

              {/* Drag handle */}
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 20 }} />

              {/* Icon */}
              <View style={{
                width: 72, height: 72, borderRadius: 36,
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center', justifyContent: 'center', marginBottom: 14,
              }}>
                <Text style={{ fontSize: 34 }}>🏪</Text>
              </View>

              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 6 }}>
                Zaman Mall Seller Center
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Pakistan ka sabse bada multi-vendor marketplace
              </Text>

              {/* Badge */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
                backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
                paddingHorizontal: 14, paddingVertical: 7,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
              }}>
                <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#1DB954' }} />
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Launching Soon — 2025
                </Text>
              </View>
            </LinearGradient>

            {/* Scrollable Content */}
            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

              {/* Intro */}
              <View style={{
                backgroundColor: isDark ? 'rgba(139,92,246,0.08)' : 'rgba(139,92,246,0.05)',
                borderRadius: 20, padding: 18, marginBottom: 24,
                borderWidth: 1, borderColor: isDark ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.15)',
              }}>
                <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 15, fontWeight: '700', marginBottom: 8 }}>
                  Apni Business Online Karo 🚀
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.65)' : '#475569', fontSize: 13, lineHeight: 22 }}>
                  Zaman Mall Multi Vendor Platform par aap apni dukaan kholein aur lakhon customers tak pahunchein. Small business se lekar bade brands tak — sab ke liye jagah hai.
                </Text>
              </View>

              {/* Features Grid */}
              <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 16, fontWeight: '900', marginBottom: 14, letterSpacing: -0.3 }}>
                🌟 Platform Features
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
                {FEATURES.map((f, i) => (
                  <View key={i} style={{
                    width: '47%',
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderRadius: 18, padding: 16,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  }}>
                    <Text style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</Text>
                    <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 13, fontWeight: '800', marginBottom: 4 }}>{f.title}</Text>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 11, lineHeight: 16 }}>{f.desc}</Text>
                  </View>
                ))}
              </View>

              {/* Seller Center Details */}
              <View style={{
                backgroundColor: isDark ? 'rgba(29,185,84,0.06)' : 'rgba(29,185,84,0.04)',
                borderRadius: 20, padding: 20, marginBottom: 24,
                borderWidth: 1, borderColor: isDark ? 'rgba(29,185,84,0.2)' : 'rgba(29,185,84,0.15)',
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(29,185,84,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="storefront" size={18} color="#1DB954" />
                  </View>
                  <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 15, fontWeight: '900' }}>Seller Center App</Text>
                </View>
                {[
                  { icon: '📱', text: 'Dedicated seller mobile app' },
                  { icon: '📊', text: 'Real-time sales dashboard' },
                  { icon: '🔔', text: 'Instant order notifications' },
                  { icon: '💬', text: 'Customer messaging system' },
                  { icon: '🏷️', text: 'Discount & coupon manager' },
                  { icon: '📈', text: 'Growth analytics & reports' },
                ].map((item, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: i < 5 ? 1 : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#475569', fontSize: 13, fontWeight: '600' }}>{item.text}</Text>
                  </View>
                ))}
              </View>

              {/* How it works */}
              <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 16, fontWeight: '900', marginBottom: 14, letterSpacing: -0.3 }}>
                🎯 Kaise Kaam Karta Hai?
              </Text>
              {[
                { step: '01', title: 'Register Karein', desc: 'Seller account banayein — bilkul free' },
                { step: '02', title: 'Shop Setup', desc: 'Apni shop customize karein — logo, banner, description' },
                { step: '03', title: 'Products Add', desc: 'Products upload karein prices ke saath' },
                { step: '04', title: 'Earn Karein', desc: 'Orders aayein, ship karein, payments paayein' },
              ].map((s, i) => (
                <View key={i} style={{
                  flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 16,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                  borderRadius: 16, padding: 14,
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
                }}>
                  <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>{s.step}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? '#fff' : '#0f172a', fontSize: 14, fontWeight: '800', marginBottom: 3 }}>{s.title}</Text>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.55)' : '#64748b', fontSize: 12, lineHeight: 18 }}>{s.desc}</Text>
                  </View>
                </View>
              ))}

              {/* Notify me */}
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  Linking.openURL('https://wa.me/923489054973?text=Mujhe%20Zaman%20Mall%20Seller%20Center%20ke%20launch%20par%20notify%20karein');
                }}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 18, paddingVertical: 16,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
                    shadowColor: '#8B5CF6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="notifications" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 15, fontWeight: '800' }}>Launch par Notify Karein</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  alignItems: 'center', paddingVertical: 14, borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9',
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                }}
              >
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.5)' : '#64748b', fontSize: 14, fontWeight: '700' }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};
// ─────────────────────────────────────────────────────────────────────────────

const MENU_ITEMS = [
  { id: 1, icon: "person-outline", title: "Edit Profile", color: "#2563EB", action: "/edit-profile" },
  { id: 2, icon: "receipt-outline", title: "Orders", color: "#10B981", action: "/orders" },
  { id: 3, icon: "location-outline", title: "Addresses", color: "#F59E0B", action: "/addresses" },
  { id: 4, icon: "heart-outline", title: "Wishlist", color: "#EF4444", action: "/(tabs)/wishlist" },
  { id: 5, icon: "chatbubbles-outline", title: "Contact Us", color: "#0EA5E9", action: "/contact" },
  { id: 6, icon: "information-circle-outline", title: "About Us", color: "#8B5CF6", action: "/about" },
] as const;

const ProfileScreen = () => {
  const { signOut, user } = useAuth();
  const { theme, toggleTheme, colors, isDark } = useTheme();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [isAIChatVisible, setIsAIChatVisible] = useState(false);
  const [showThemeAnim, setShowThemeAnim] = useState(false);

  const animatedValue = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isDark ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
    }).start();
  }, [isDark]);

  const toggleAnimation = () => {
    setShowThemeAnim(true);
    toggleTheme();
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E2E8F0', '#2D3748'],
  });

  const iconColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#F59E0B', '#1DB954'],
  });

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
    }, [user])
  );

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar, name')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setAvatar(data.avatar || null);
        setFullName(data.name || "");
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => {
    router.push(action as Href);
  };

  const getImageSource = () => {
    if (avatar) {
      if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('file://') || avatar.startsWith('blob:')) {
        return { uri: avatar };
      }
      return { uri: `data:image/jpeg;base64,${avatar}` };
    }
    const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";
    return { uri: "https://ui-avatars.com/api/?name=" + displayName + "&background=1DB954&color=fff&size=128" };
  };

  const displayName = fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "User";

  return (
    <SafeScreen>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* APP HEADER */}
        <View className="px-6 pb-4 pt-2 flex-row items-center justify-between">
           <View className="flex-row items-center">
             <Image 
                source={require("@/assets/images/zaman-logo.png")} 
                className="w-12 h-12 mr-3 rounded-full"
                contentFit="contain"
              />
              <Text style={{ color: colors.text, fontSize: 30, fontWeight: 'bold', letterSpacing: -0.5 }}>Profile</Text>
           </View>

           {/* Animated Theme Toggle */}
           <TouchableOpacity activeOpacity={0.8} onPress={toggleAnimation}>
             <Animated.View style={{ 
               width: 56, 
               height: 32, 
               borderRadius: 16, 
               backgroundColor, 
               padding: 4,
               justifyContent: 'center'
             }}>
               <Animated.View style={{ 
                 width: 24, 
                 height: 24, 
                 borderRadius: 12, 
                 backgroundColor: '#FFFFFF',
                 transform: [{ translateX }],
                 alignItems: 'center',
                 justifyContent: 'center',
                 shadowColor: '#000',
                 shadowOffset: { width: 0, height: 2 },
                 shadowOpacity: 0.2,
                 shadowRadius: 2,
                 elevation: 3
               }}>
                 <Animated.View style={{ transform: [{ rotate: isDark ? '0deg' : '0deg' }] }}>
                   <Ionicons 
                     name={isDark ? "moon" : "sunny"} 
                     size={14} 
                     color={isDark ? "#1DB954" : "#F59E0B"} 
                   />
                 </Animated.View>
               </Animated.View>
             </Animated.View>
           </TouchableOpacity>
        </View>

        {/* HEADER */}
        <View className="px-6 pb-6">
          <View
            style={{
              backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.97)",
              borderRadius: 32,
              padding: 24,
              borderWidth: 1.5,
              borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: isDark ? 0.3 : 0.1,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <LinearGradient
              colors={
                isDark
                  ? ["rgba(37, 99, 235, 0.18)", "rgba(30, 41, 59, 0.05)", "transparent"]
                  : ["rgba(37, 99, 235, 0.08)", "rgba(255, 255, 255, 0.4)", "transparent"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View className="flex-row items-center">
              <TouchableOpacity 
                className="relative"
                activeOpacity={0.8}
                onPress={() => router.push("/edit-profile")}
              >
                <View style={{
                  padding: 3,
                  borderRadius: 45,
                  backgroundColor: colors.primary + '40',
                  borderWidth: 1,
                  borderColor: colors.primary + '60'
                }}>
                  <Image
                    source={getImageSource()}
                    style={{ width: 84, height: 84, borderRadius: 42 }}
                    transition={200}
                  />
                </View>
                <View style={{ 
                  position: 'absolute', 
                  bottom: -2, 
                  right: -2, 
                  backgroundColor: colors.primary, 
                  width: 32, 
                  height: 32, 
                  borderRadius: 16, 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderWidth: 3, 
                  borderColor: isDark ? "#1E293B" : "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4
                }}>
                  <Ionicons name="camera" size={16} color="#000" />
                </View>
              </TouchableOpacity>

              <View className="flex-1 ml-5">
                <Text style={{ 
                  color: colors.text, 
                  fontSize: 26, 
                  fontWeight: '900', 
                  marginBottom: 2,
                  letterSpacing: -0.5
                }}>
                  {displayName}
                </Text>
                <View className="flex-row items-center">
                  <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#10B981',
                    marginRight: 6
                  }} />
                  <Text style={{ 
                    color: colors.textSecondary, 
                    fontSize: 13,
                    fontWeight: '600',
                    opacity: 0.8
                  }}>
                    Premium Member
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* QUICK ACTIONS SECTION (Replaced Stats) */}
        <View className="px-6 mb-8">
          <View 
            style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
              borderRadius: 28,
              padding: 16,
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
            }}
          >
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', uppercase: true, letterSpacing: 1, marginBottom: 12, marginLeft: 4 }}>
              Security & Loyalty
            </Text>
            
            <View className="flex-row justify-between">
              {[
                { label: 'Verified', icon: 'checkmark-shield', color: '#10B981' },
                { label: 'Wallet', icon: 'wallet', color: '#2563EB' },
                { label: 'Security', icon: 'finger-print', color: '#8B5CF6' },
                { label: 'Gift', icon: 'gift', color: '#EF4444' },
              ].map((action, i) => (
                <TouchableOpacity 
                  key={i}
                  activeOpacity={0.7}
                  style={{ alignItems: 'center', width: '22%' }}
                >
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: action.color + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 6,
                    borderWidth: 1,
                    borderColor: action.color + '25'
                  }}>
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <Text style={{ color: colors.text, fontSize: 10, fontWeight: '700' }}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* MENU ITEMS */}
        <View className="flex-row flex-wrap gap-2 mx-6 mb-3">
          {/* Zaman AI Premium Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', 
            borderRadius: 18, 
            padding: 16, 
            alignItems: 'center', 
            justifyContent: 'center', 
            width: "100%", 
            marginBottom: 12,
            borderWidth: 2,
            borderColor: '#2563EB',
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
            overflow: 'hidden'
          }}
          activeOpacity={0.8}
          onPress={() => setIsAIChatVisible(true)}
        >
          <LinearGradient
            colors={isDark ? ["rgba(37, 99, 235, 0.25)", "rgba(37, 99, 235, 0.1)"] : ["rgba(37, 99, 235, 0.12)", "rgba(37, 99, 235, 0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View
            className="rounded-full w-13 h-13 items-center justify-center mb-2.5"
            style={{ 
              backgroundColor: '#2563EB',
              borderWidth: 2,
              borderColor: '#1D4ED8',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 4
            }}
          >
            <Ionicons name="hardware-chip" size={26} color="#FFFFFF" />
          </View>
          <View className="items-center">
            <Text style={{ 
              color: '#2563EB', 
              fontWeight: '900', 
              fontSize: 17, 
              letterSpacing: 1.3,
              textShadowColor: "rgba(37, 99, 235, 0.3)",
              textShadowOffset: { width: 0, height: 2 },
              textShadowRadius: 4
            }}>ZAMAN AI</Text>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginTop: 5,
              backgroundColor: '#2563EB',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 13,
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 3
            }}>
              <Ionicons name="chatbubble-ellipses" size={11} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={{ 
                color: "#FFFFFF", 
                fontWeight: '800', 
                fontSize: 10.5, 
                letterSpacing: 1.2 
              }}>EXECUTIVE AI CONCIERGE</Text>
            </View>
          </View>
        </TouchableOpacity>

          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={{
                backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "#FFFFFF",
                borderRadius: 28,
                padding: 20,
                alignItems: "center",
                justifyContent: "center",
                width: "48.5%",
                borderWidth: 1.5,
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : 0.06,
                shadowRadius: 10,
                elevation: 3,
                marginBottom: 4,
              }}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.action)}
            >
              <View
                style={{
                  width: 56, height: 56, borderRadius: 16,
                  alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                  backgroundColor: item.color + (isDark ? "25" : "18"),
                  borderWidth: 1,
                  borderColor: item.color + "35",
                }}
              >
                <Ionicons name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={{ color: colors.text, fontWeight: "800", fontSize: 15, letterSpacing: -0.2 }}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* NOTIFICATONS BTN */}
        <View
          style={{
            marginBottom: 12,
            marginHorizontal: 24,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.97)",
            borderRadius: 24,
            padding: 16,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.03)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/notifications")}
          >
            <View className="flex-row items-center">
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* PRIVACY AND SECURTIY LINK */}
        <View
          style={{
            marginBottom: 12,
            marginHorizontal: 24,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.97)",
            borderRadius: 24,
            padding: 16,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.03)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            activeOpacity={0.7}
            onPress={() => router.push("/privacy-security")}
          >
            <View className="flex-row items-center">
              <View style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: '#8B5CF620',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12
              }}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#8B5CF6" />
              </View>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>Privacy & Security</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* SOCIAL MEDIA LINKS */}
        <View
          style={{
            marginBottom: 12,
            marginHorizontal: 24,
            backgroundColor: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.97)",
            borderRadius: 24,
            padding: 20,
            borderWidth: 1.5,
            borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.03)",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 10,
            elevation: 2,
          }}
        >
          <Text style={{
            color: colors.textSecondary, fontSize: 11, fontWeight: '800',
            textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16,
          }}>
            Connect With Us
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
            {[
              { icon: 'logo-facebook',  color: '#1877F2', label: 'Facebook',  url: 'https://www.facebook.com/share/14XsWy5LpLM/' },
              { icon: 'logo-instagram', color: '#E4405F', label: 'Instagram', url: 'https://www.instagram.com/adilagral?igsh=cWdiYmFlNzdzMDIz' },
              { icon: 'logo-whatsapp',  color: '#25D366', label: 'WhatsApp',  url: 'https://wa.me/923489054973' },
              { icon: 'globe-outline',  color: colors.primary, label: 'Website', url: 'https://zamanmall.netlify.app' },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                onPress={() => Linking.openURL(s.url).catch(() => {})}
                activeOpacity={0.75}
                style={{ alignItems: 'center', gap: 6 }}
              >
                <View style={{
                  width: 52, height: 52, borderRadius: 16,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: s.color + '15',
                  borderWidth: 1, borderColor: s.color + '30',
                }}>
                  <Ionicons name={s.icon as any} size={26} color={s.color} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* SIGNOUT BTN */}
        <TouchableOpacity
          style={{
            marginHorizontal: 24,
            marginBottom: 20,
            backgroundColor: isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
            borderRadius: 24,
            paddingVertical: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1.5,
            borderColor: "rgba(239, 68, 68, 0.25)",
            overflow: "hidden",
          }}
          activeOpacity={0.8}
          onPress={() => signOut()}
        >
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10
          }}>
            <Ionicons name="log-out" size={18} color="#EF4444" />
          </View>
          <Text style={{ color: "#EF4444", fontWeight: '900', fontSize: 16, letterSpacing: 0.5 }}>Sign Out</Text>
        </TouchableOpacity>

        {/* ── MULTI VENDOR COMING SOON ── */}
        <ComingSoonSection colors={colors} isDark={isDark} />

        {/* Footer — Version & Copyright */}
        <View style={{ alignItems: 'center', gap: 6, marginBottom: 24, paddingHorizontal: 24 }}>
          {/* Divider */}
          <View style={{ width: 40, height: 2, borderRadius: 1, backgroundColor: colors.border, marginBottom: 8 }} />

          {/* Logo small */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <Image
              source={require("@/assets/images/zaman-logo.png")}
              style={{ width: 22, height: 22, borderRadius: 11 }}
              contentFit="contain"
            />
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800', letterSpacing: 0.3 }}>
              Zaman <Text style={{ color: colors.primary }}>Mall</Text>
            </Text>
          </View>

          {/* Version */}
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', opacity: 0.55 }}>
            Version 1.1.2
          </Text>

          {/* Copyright */}
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', opacity: 0.5, textAlign: 'center', letterSpacing: 0.2 }}>
            © 2025 All Rights Reserved
          </Text>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', opacity: 0.8, letterSpacing: 0.3 }}>
            @adilzaman
          </Text>
        </View>
      </ScrollView>

      <AIChatModal 
        visible={isAIChatVisible} 
        onClose={() => setIsAIChatVisible(false)} 
      />

      {/* Theme toggle animation overlay */}
      {showThemeAnim && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0, right: 0, top: 0, bottom: 0,
            alignItems: 'center', justifyContent: 'center',
            zIndex: 999,
          }}
        >
          <LottieView
            source={require("../../assets/1e401603-a1fd-4815-b9aa-322277f2dd10.json")}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowThemeAnim(false)}
            style={{ width: 200, height: 200 }}
          />
        </View>
      )}
    </SafeScreen>
  );
};

export default ProfileScreen;
