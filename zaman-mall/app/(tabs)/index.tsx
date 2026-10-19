import ProductsGrid, { renderProduct } from "@/components/ProductsGrid";
import useWishlist from "@/hooks/useWishlist";
import { Share, Linking } from "react-native";
import { useAuth } from "@/context/AuthContext";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";
import AdsCarousel from "@/components/AdsCarousel";
import TrendingSection from "@/components/TrendingSection";
import AIChatModal from "@/components/AIChatModal";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/lib/supabase";
import useCategories from "@/hooks/useCategories";
import { useCountrySession } from "@/context/CountrySessionContext";
import ProductSkeleton from "@/components/ProductSkeleton";
import LottieImage from "@/components/LottieImage";
import LottieView from "lottie-react-native";
import AffiliateBrandsGrid from "@/components/AffiliateBrandsGrid";
import AffiliateProductsGrid from "@/components/AffiliateProductsGrid";
import { useOrders } from "@/hooks/useOrders";

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Animated,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useNotifications } from "@/hooks/useNotifications";
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-async-storage/async-storage';
import PremiumButton from "@/components/PremiumButton";
import { LinearGradient } from "expo-linear-gradient";

import { FlashList } from "@shopify/flash-list";

const { width: SCREEN_W } = Dimensions.get("window");

type SortOption = 'Best Sellers' | 'Price: Low to High' | 'Price: High to Low';
const BATCH_SIZE = 30;

// ── Zeels types ──────────────────────────────────────────────────────────────
interface ZeelProduct {
  id: string; name: string; price: number; image: string; images?: string[]; country?: string;
}
interface Zeel {
  id: string; title: string; description?: string;
  video_url: string; thumbnail_url?: string;
  product_id?: string | null; likes_count: number;
  is_active: boolean; product?: ZeelProduct | null;
}

const ShopScreen = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } = useWishlist();
  const [searchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<SortOption>('Best Sellers');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [isAIChatVisible, setIsAIChatVisible] = useState(false);
  const { colors, isDark } = useTheme();
  const { currentSession, setSession } = useCountrySession();
  const [isOnline, setIsOnline] = useState(true);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [isBatchSwitching, setIsBatchSwitching] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fabAnim = useRef(new Animated.Value(1)).current;
  const fabPulse = useRef(new Animated.Value(1)).current;
  const lastScrollY = useRef(0);
  const categoriesYRef = useRef(0);

  // Pulse animation for FAB
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(fabPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(fabPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleScroll = useCallback((e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const delta = y - lastScrollY.current;
    lastScrollY.current = y;
    // Hide FAB scrolling down, show scrolling up
    if (delta > 8) {
      Animated.spring(fabAnim, { toValue: 0, useNativeDriver: true, speed: 20 }).start();
    } else if (delta < -8) {
      Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    }
  }, []);

  // Payment status banner — check for pending/approved/rejected online payments
  const { data: orders } = useOrders();
  const queryClient = useQueryClient();

  const pendingPaymentOrder = useMemo(() => {
    if (!orders?.length) return null;
    const now = Date.now();
    const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

    return orders.find(o => {
      if (o.paymentMethod !== 'easypaisa' && o.paymentMethod !== 'jazzcash') return false;
      const status = o.paymentStatus;

      // awaiting_approval — always show
      if (status === 'awaiting_approval') return true;

      // rejected — always show
      if (status === 'rejected') return true;

      // approved — show for 2 days only
      if (status === 'approved') {
        const orderDate = new Date(o.date).getTime();
        return (now - orderDate) < TWO_DAYS_MS;
      }

      return false;
    }) || null;
  }, [orders]);

  // ── Home screen realtime: payment status instantly update ─────────────────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`home-payment-status-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const newPaymentStatus = updated.paymentStatus || updated.payment_status;

          // Instantly update the cached order so banner re-renders immediately
          queryClient.setQueryData(
            ['orders', user.id],
            (old: any[] | undefined) => {
              if (!old) return old;
              return old.map((o) =>
                String(o.id) === String(updated.id)
                  ? { ...o, status: updated.status || o.status, paymentStatus: newPaymentStatus || o.paymentStatus }
                  : o
              );
            }
          );

          // Also invalidate to ensure full consistency
          queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Animated sliding pill for country switcher — instant highlight on press
  const countrySlide = useRef(new Animated.Value(currentSession === 'pakistan' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(countrySlide, {
      toValue: currentSession === 'pakistan' ? 0 : 1,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.5,
    }).start();
  }, [currentSession]);

  // Lottie title animation — plays once ever, persisted in AsyncStorage
  const [showLottie, setShowLottie] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('@zaman_intro_played').then((val) => {
      if (!val) setShowLottie(true);
    });
  }, []);

  const handleAnimationFinish = useCallback(() => {
    setShowLottie(false);
    AsyncStorage.setItem('@zaman_intro_played', 'true');
  }, []);

  // Zeels state
  const [zeels, setZeels] = useState<Zeel[]>([]);
  const [zeelsLoading, setZeelsLoading] = useState(true);

  const {
    data: products,
    isLoading,
    isError,
    isFetching,
    refetch
  } = useProducts();
  const { unreadCount } = useNotifications();
  const { categories } = useCategories();

  const isInitialLoading = isLoading || (isFetching && products.length === 0);

  const [totalProductsCount, setTotalProductsCount] = useState(0);

  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        let query = supabase
          .from('products')
          .select('*', { count: 'exact', head: true });

        if (currentSession) {
          query = query.eq('country', currentSession);
        }

        // Add limit to override Supabase default 1000 limit for count
        const { count, error } = await query.limit(10000);
        if (!error && count !== null) {
          setTotalProductsCount(count);
        }
      } catch (err) {
        console.error('Error fetching total count:', err);
      }
    };
    fetchTotalCount();
  }, [currentSession]);

  // Load zeels — shuffled on every reload
  useEffect(() => {
    const loadZeels = async () => {
      setZeelsLoading(true);
      try {
        const { data: zeelData } = await supabase
          .from('zeels')
          .select('*')
          .eq('is_active', true)
          .limit(20);

        if (!zeelData?.length) { setZeels([]); setZeelsLoading(false); return; }

        const productIds = zeelData.filter(z => z.product_id).map(z => z.product_id as string);
        let productsMap: Record<string, ZeelProduct> = {};
        if (productIds.length > 0) {
          const { data: prodData } = await supabase
            .from('products')
            .select('id, name, price, image, images, country')
            .in('id', productIds);
          if (prodData) productsMap = Object.fromEntries(prodData.map((p: any) => [p.id, p]));
        }

        const mapped = zeelData.map((z: any) => ({
          ...z,
          product: z.product_id ? (productsMap[z.product_id] ?? null) : null,
        }));

        // Shuffle once on mount so order is varied but stable
        const shuffled = [...mapped].sort(() => Math.random() - 0.5);
        setZeels(shuffled);
      } catch {}
      setZeelsLoading(false);
    };
    loadZeels();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    // filtering by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    // sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'Price: Low to High') return a.price - b.price;
      if (sortBy === 'Price: High to Low') return b.price - a.price;
      if (sortBy === 'Best Sellers') {
        const ratingA = a.averageRating || 0;
        const ratingB = b.averageRating || 0;
        return ratingB - ratingA;
      }
      return 0;
    });
  }, [products, selectedCategory, sortBy]);

  // Batching logic - use filtered and sorted products count for batches
  const totalBatches = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAndSortedProducts.length / BATCH_SIZE));
  }, [filteredAndSortedProducts]);

  const visibleProducts = useMemo(() => {
    const start = currentBatch * BATCH_SIZE;
    return filteredAndSortedProducts.slice(start, start + BATCH_SIZE);
  }, [filteredAndSortedProducts, currentBatch]);

  const handleNextBatch = () => {
    if (currentBatch < totalBatches - 1) {
      setIsBatchSwitching(true);
      setCurrentBatch(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: categoriesYRef.current, animated: true });
      setTimeout(() => setIsBatchSwitching(false), 500);
    }
  };

  const handlePrevBatch = () => {
    if (currentBatch > 0) {
      setIsBatchSwitching(true);
      setCurrentBatch(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: categoriesYRef.current, animated: true });
      setTimeout(() => setIsBatchSwitching(false), 500);
    }
  };

  useEffect(() => {
    setCurrentBatch(0);
  }, [currentSession, selectedCategory, sortBy]);

  const ListHeader = useCallback(() => (
    <View style={{ backgroundColor: colors.background }}>
      {/* HEADER */}
      <View className="px-6 pb-2 pt-4">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Image
              source={require("@/assets/images/zaman-logo.png")}
              className="w-16 h-16 mr-2 rounded-full"
              resizeMode="contain"
            />
            {showLottie ? (
              <LottieView
                source={require("@/assets/246003ce-1185-11ee-a1fb-b35ad4109460.json")}
                autoPlay
                loop={false}
                onAnimationFinish={handleAnimationFinish}
                style={{ width: 130, height: 40 }}
              />
            ) : (
              <Text style={{
                fontSize: 26,
                fontWeight: '900',
                letterSpacing: -0.5,
              }}>
                {['Z','a','m','a','n',' ','M','a','l','l'].map((char, i) => {
                  const gradientColors = [
                    '#02B4C6',
                    '#2EC4B6',
                    '#7ACA3A',
                    '#E8C41A',
                    '#FF8020',
                    '#FF30CD',
                    '#A060FF',
                    '#3AB9F6',
                    '#02B4C6',
                    '#2EC4B6',
                  ];
                  return (
                    <Text key={i} style={{ color: gradientColors[i % gradientColors.length], fontSize: 26, fontWeight: '900' }}>
                      {char}
                    </Text>
                  );
                })}
              </Text>
            )}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              style={{ backgroundColor: colors.glassSurface, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, marginRight: 12, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' }}
              activeOpacity={0.7}
              onPress={() => setIsAIChatVisible(true)}
            >
              <Text style={{ color: "#2563eb", fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>AI</Text>
              <View style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, backgroundColor: '#10B981', borderRadius: 4, borderWidth: 1.5, borderColor: colors.background }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={{ backgroundColor: colors.glassSurface, padding: 8, borderRadius: 20, position: 'relative', borderWidth: 1, borderColor: colors.glassBorder }}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications')}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {unreadCount > 0 && (
                <View style={{ position: 'absolute', top: 0, right: 0, width: 10, height: 10, backgroundColor: '#EF4444', borderRadius: 5, borderWidth: 2, borderColor: colors.background }} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SEARCH BAR */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/search')}
          style={{ position: 'relative', marginBottom: 24 }}
        >
          <View style={{ position: 'absolute', inset: -4, backgroundColor: '#2563EB', borderRadius: 28, opacity: 0.25 }} />
          <View style={{ backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF', borderWidth: 2, borderColor: '#2563EB', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 28, shadowColor: '#2563EB', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }}>
            <View style={{ backgroundColor: '#2563EB', width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14, transform: [{ rotate: '12deg' }], shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 }}>
              <Ionicons color={"#fff"} size={20} name="search" style={{ transform: [{ rotate: '-12deg' }] }} />
            </View>
            <View className="flex-1">
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16, letterSpacing: -0.5 }}>Premium Search</Text>
              <Text style={{ color: '#2563EB', fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1.5 }}>Explore Zaman Mall</Text>
            </View>
            <View style={{ backgroundColor: '#2563EB', width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}>
              <Ionicons name="options-outline" size={18} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>

        {!isOnline && (
          <View style={{ marginTop: 4, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "rgba(248,113,113,0.16)" : "rgba(248,113,113,0.12)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: isDark ? "rgba(248,113,113,0.4)" : "rgba(248,113,113,0.6)" }}>
            <Ionicons name="warning-outline" size={14} color="#f97373" style={{ marginRight: 6 }} />
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: "600" }}>Offline Mode • Cached data dikhaya ja raha hai</Text>
          </View>
        )}
      </View>

      {/* PAYMENT STATUS BANNER */}
      {user && pendingPaymentOrder && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(profile)/orders')}
          style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 20, overflow: 'hidden' }}
        >
          {pendingPaymentOrder.paymentStatus === 'awaiting_approval' && (
            <LinearGradient
              colors={['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.08)']}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 14,
                borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
                gap: 12,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(245,158,11,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="time-outline" size={20} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  ⏳ Payment Review Pending
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', fontSize: 11, marginTop: 2 }}>
                  {pendingPaymentOrder.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} receipt admin ke paas hai — Order #{pendingPaymentOrder.id.slice(-6).toUpperCase()}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
            </LinearGradient>
          )}

          {pendingPaymentOrder.paymentStatus === 'approved' && (
            <LinearGradient
              colors={['rgba(16,185,129,0.18)', 'rgba(16,185,129,0.08)']}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 14,
                borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.35)',
                gap: 12,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#10B981', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🎉 Payment Approved!
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', fontSize: 11, marginTop: 2 }}>
                  Aapka order #{pendingPaymentOrder.id.slice(-6)} ab active hai
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#10B981" />
            </LinearGradient>
          )}

          {pendingPaymentOrder.paymentStatus === 'rejected' && (
            <LinearGradient
              colors={['rgba(239,68,68,0.18)', 'rgba(239,68,68,0.08)']}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 14,
                borderRadius: 20, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
                gap: 12,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Payment Reject Ho Gayi
                </Text>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', fontSize: 11, marginTop: 2 }}>
                  Order #{pendingPaymentOrder.id.slice(-6)} — My Orders mein details dekhein
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#EF4444" />
            </LinearGradient>
          )}
        </TouchableOpacity>
      )}

      {/* ADS CAROUSEL */}
      <AdsCarousel />

      {/* COUNTRY SESSION SWITCHER */}
      <View className="px-6 mb-4">
        {(() => {
          const tabW = (SCREEN_W - 48) / 2; // 24px padding each side
          return (
            <View style={{
              flexDirection: 'row',
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              borderRadius: 50,
              padding: 4,
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Sliding highlight pill */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 4,
                  left: 4,
                  width: tabW - 8,
                  bottom: 4,
                  borderRadius: 50,
                  backgroundColor: currentSession === 'pakistan' ? '#16A34A' : '#DC2626',
                  transform: [{
                    translateX: countrySlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, tabW],
                    }),
                  }],
                  shadowColor: currentSession === 'pakistan' ? '#16A34A' : '#DC2626',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.45,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              />

              {/* Pakistan button */}
              <TouchableOpacity
                onPress={() => setSession('pakistan')}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  zIndex: 1,
                }}
              >
                <Image source={require("@/assets/images/pakistan.png")} style={{ width: 28, height: 18, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }} resizeMode="cover" />
                <Text style={{
                  color: currentSession === 'pakistan' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'),
                  fontWeight: 'bold',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>Pakistan</Text>
              </TouchableOpacity>

              {/* China button */}
              <TouchableOpacity
                onPress={() => setSession('china')}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  zIndex: 1,
                }}
              >
                <Image source={require("@/assets/images/china.png")} style={{ width: 28, height: 18, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }} resizeMode="cover" />
                <Text style={{
                  color: currentSession === 'china' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'),
                  fontWeight: 'bold',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}>China</Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

      {/* TRENDING NOW SECTION */}
      <TrendingSection products={products || []} isLoading={isLoading} />

      {/* ── AFFILIATE BRANDS GRID ────────────────────────── */}
      <AffiliateBrandsGrid />

      {/* ── AFFILIATE PRODUCTS GRID ──────────────────────── */}
      <AffiliateProductsGrid />

      {/* ── PRODUCTS / ZEELS TOGGLE ──────────────────────── */}
      <View style={{ paddingHorizontal: 16, marginTop: 4, marginBottom: 12 }}>
        {/* Toggle slider */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderRadius: 16, padding: 4,
          borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
        }}>
          <View style={{
            flex: 1, borderRadius: 12, backgroundColor: colors.primary,
            paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
            flexDirection: 'row', gap: 6,
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
          }}>
            <Ionicons name="grid" size={15} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 }}>Products</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
              <Text style={{ color: '#fff', fontSize: 9, fontWeight: '900' }}>{totalProductsCount}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/zeels')}
            activeOpacity={0.75}
            style={{ flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
          >
            <Ionicons name="play-circle" size={15} color="#a78bfa" />
            <Text style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)', fontSize: 13, fontWeight: '700' }}>Zeels</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── ZEELS SECTION ─────────────────────────────────── */}
      {(zeelsLoading || zeels.length > 0) && (
        <View style={{ marginBottom: 8 }}>
          {/* Section header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(167,139,250,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(167,139,250,0.3)' }}>
                <Ionicons name="play-circle" size={18} color="#a78bfa" />
              </View>
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.3 }}>Zeels</Text>
                <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Short Reels</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/zeels')}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(167,139,250,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(167,139,250,0.25)' }}
              activeOpacity={0.7}
            >
              <Text style={{ color: '#a78bfa', fontSize: 11, fontWeight: '700' }}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#a78bfa" />
            </TouchableOpacity>
          </View>
          {/* Zeels horizontal scroll */}
          <ScrollView
            horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
            decelerationRate="fast" snapToInterval={SCREEN_W * 0.55 + 12}
          >
            {zeelsLoading ? (
              [1, 2, 3].map(i => (
                <View key={i} style={{ width: SCREEN_W * 0.55, height: SCREEN_W * 0.85, borderRadius: 20, backgroundColor: isDark ? '#1E1E1E' : '#E8E8E8', overflow: 'hidden' }}>
                  <View style={{ flex: 1, backgroundColor: isDark ? 'rgba(167,139,250,0.06)' : 'rgba(167,139,250,0.04)' }} />
                </View>
              ))
            ) : (
              zeels.map(zeel => (
                <TouchableOpacity
                  key={zeel.id} activeOpacity={0.88}
                  onPress={() => router.push('/(tabs)/zeels')}
                  style={{ width: SCREEN_W * 0.55, height: SCREEN_W * 0.85, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: 'rgba(167,139,250,0.2)' }}
                >
                  {zeel.thumbnail_url ? (
                    <ExpoImage source={{ uri: zeel.thumbnail_url }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} contentFit="cover" transition={300} />
                  ) : (
                    <LinearGradient colors={['#1a0533', '#0d001a']} style={{ position: 'absolute', width: '100%', height: '100%' }} />
                  )}
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' }} />
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' }}>
                      <Ionicons name="play" size={20} color="#fff" style={{ marginLeft: 3 }} />
                    </View>
                  </View>
                  <View style={{ position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                    <Ionicons name="heart" size={11} color="#f472b6" />
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                      {zeel.likes_count >= 1000 ? `${(zeel.likes_count / 1000).toFixed(1)}k` : zeel.likes_count}
                    </Text>
                  </View>
                  <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', marginBottom: 6 }} numberOfLines={2}>{zeel.title}</Text>
                    {zeel.product && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' }}>
                        <Image source={{ uri: zeel.product.image || zeel.product.images?.[0] }} style={{ width: 22, height: 22, borderRadius: 6 }} resizeMode="cover" />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 9, fontWeight: '600' }} numberOfLines={1}>{zeel.product.name}</Text>
                          <Text style={{ color: '#a78bfa', fontSize: 10, fontWeight: '900' }}>Rs. {zeel.product.price.toLocaleString()}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* CATEGORY FILTER */}
      <View
        className="mb-4"
        onLayout={(e) => {
          categoriesYRef.current = e.nativeEvent.layout.y;
        }}
      >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory("All")}
            style={{ marginRight: 12, borderRadius: 20, width: 80, height: 80, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: selectedCategory === "All" ? colors.primary : colors.surface, borderWidth: 1, borderColor: selectedCategory === "All" ? colors.primary : colors.border }}
          >
            <Ionicons name="grid-outline" size={24} color={selectedCategory === "All" ? "#ffffff" : colors.text} />
            <Text style={{ fontSize: 10, marginTop: 4, color: selectedCategory === "All" ? "#ffffff" : colors.text, fontWeight: '600' }}>All</Text>
          </TouchableOpacity>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.name;
            return (
              <TouchableOpacity
                key={category.id}
                onPress={() => setSelectedCategory(category.name)}
                style={{ marginRight: 12, borderRadius: 20, width: 80, height: 80, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: isSelected ? colors.primary : colors.surface, borderWidth: 1, borderColor: isSelected ? colors.primary : colors.border }}
              >
                <LottieImage
                  uri={category.image_url}
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                  lottieSize={30}
                />
                <Text style={{ fontSize: 10, marginTop: 4, color: isSelected ? "#ffffff" : colors.text, fontWeight: '600' }} numberOfLines={1}>{category.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* SORT ROW + TOTAL COUNT */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>{sortBy}</Text>
          <View style={{ backgroundColor: colors.glassSurface, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder }}>
            <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900' }}>{totalProductsCount} products</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setIsSortModalVisible(true)}
          style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.glassSurface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.glassBorder }}
        >
          <Ionicons name="funnel-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: 'bold' }}>Sort</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [colors, isDark, currentSession, selectedCategory, categories, unreadCount, isOnline, totalProductsCount, sortBy, isLoading, zeels, zeelsLoading, showLottie, handleAnimationFinish, pendingPaymentOrder, user]);

  return (
    <SafeScreen>
      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <ListHeader />

        <View style={{ paddingHorizontal: 16 }}>
          {(isInitialLoading || isBatchSwitching) ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={{ width: '48.5%' }}>
                  <ProductSkeleton />
                </View>
              ))}
            </View>
          ) : visibleProducts.length > 0 ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {visibleProducts.map((item) => (
                <View key={item.id} style={{ width: '48.5%' }}>
                  {renderProduct(
                    item,
                    colors,
                    isDark,
                    toggleWishlist,
                    isInWishlist,
                    isAddingToWishlist,
                    isRemovingFromWishlist,
                    async (product: any) => {
                      try {
                        const productUrl = `https://zamanmall.netlify.app/product/${product.id}`;
                        const shareMessage = `Check out this product on Zaman Mall!\n\n${product.name}\n\nPrice: Rs. ${product.price?.toLocaleString() || '0'}\n\n🔗 View here: ${productUrl}`.trim();
                        await Share.share({ message: shareMessage, url: productUrl });
                      } catch (error: any) {
                        console.error('Error sharing product:', error);
                      }
                    }
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={{ flex: 1, paddingHorizontal: 16 }}>
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 50 }}>
                <Ionicons name="cube-outline" size={48} color={colors.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={{ color: colors.textSecondary, marginTop: 12, fontWeight: '600' }}>
                  No products found
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* BATCH CONTROLS - CENTERED WITH ANIMATED DOTS */}
        {totalBatches > 1 && (
          <View style={{ paddingVertical: 40, paddingBottom: 32, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.glassSurface,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.glassBorder,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 1
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>Page </Text>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '900' }}>{currentBatch + 1}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}> of </Text>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '900' }}>{totalBatches}</Text>
              </View>

              {/* Enhanced Pagination Dots */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 16 }}>
                {(() => {
                  const maxVisibleDots = 7;
                  let start = 0;
                  let end = totalBatches - 1;

                  if (totalBatches > maxVisibleDots) {
                    start = Math.max(0, currentBatch - 3);
                    end = Math.min(totalBatches - 1, start + (maxVisibleDots - 1));
                    if (end - start < maxVisibleDots - 1) {
                      start = Math.max(0, end - (maxVisibleDots - 1));
                    }
                  }

                  return Array.from({ length: end - start + 1 }, (_, index) => {
                    const batchNumber = start + index;
                    const isActive = batchNumber === currentBatch;

                    let scale = 1;
                    let opacity = 1;

                    if (totalBatches > maxVisibleDots) {
                      if (batchNumber === start && start > 0) {
                        scale = 0.5;
                        opacity = 0.4;
                      } else if (batchNumber === start + 1 && start > 0) {
                        scale = 0.8;
                        opacity = 0.7;
                      } else if (batchNumber === end && end < totalBatches - 1) {
                        scale = 0.5;
                        opacity = 0.4;
                      } else if (batchNumber === end - 1 && end < totalBatches - 1) {
                        scale = 0.8;
                        opacity = 0.7;
                      }
                    }

                    if (isActive) {
                      scale = 1.15;
                      opacity = 1;
                    } else if (!isActive && totalBatches <= maxVisibleDots) {
                      opacity = 0.4;
                    }

                    return (
                      <TouchableOpacity
                        key={batchNumber}
                        onPress={() => {
                          setIsBatchSwitching(true);
                          setCurrentBatch(batchNumber);
                          scrollViewRef.current?.scrollTo({ y: categoriesYRef.current, animated: true });
                          setTimeout(() => setIsBatchSwitching(false), 500);
                        }}
                        style={{
                          width: isActive ? 24 : 8,
                          height: 8,
                          borderRadius: 4,
                          marginHorizontal: 4,
                          backgroundColor: isActive ? colors.primary : (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.25)'),
                          opacity: opacity,
                          transform: [{ scale }],
                        }}
                        activeOpacity={0.7}
                      />
                    );
                  });
                })()}
              </View>
            </View>

            {/* Navigation Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 20 }}>
              <TouchableOpacity
                onPress={handlePrevBatch}
                disabled={currentBatch === 0 || isBatchSwitching}
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.glassSurface,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 25,
                  borderWidth: 1,
                  borderColor: colors.glassBorder,
                  opacity: (currentBatch === 0 || isBatchSwitching) ? 0.5 : 1,
                  marginRight: 20,
                  minWidth: 110,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isBatchSwitching ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <>
                    <Ionicons name="chevron-back" size={16} color={colors.text} style={{ marginRight: 6 }} />
                    <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>Previous</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextBatch}
                disabled={currentBatch >= totalBatches - 1 || isBatchSwitching}
                style={{
                  flexDirection: 'row',
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 12,
                  borderRadius: 25,
                  opacity: (currentBatch >= totalBatches - 1 || isBatchSwitching) ? 0.5 : 1,
                  marginLeft: 20,
                  minWidth: 110,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isBatchSwitching ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <>
                    <Text style={{ color: "#000", fontWeight: 'bold', fontSize: 14 }}>Next</Text>
                    <Ionicons name="chevron-forward" size={16} color="#000" style={{ marginLeft: 6 }} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── SOCIAL MEDIA SECTION ── */}
        <View style={{
          marginHorizontal: 16,
          marginBottom: 120,
          marginTop: 8,
          borderRadius: 24,
          padding: 24,
          backgroundColor: isDark ? '#161616' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.25 : 0.06,
          shadowRadius: 12,
          elevation: 4,
          alignItems: 'center',
        }}>
          {/* Title */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
              Connect With Us
            </Text>
            <View style={{ width: 32, height: 2.5, borderRadius: 2, backgroundColor: colors.primary }} />
          </View>

          {/* 4 Social Icons */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16 }}>

            {/* Facebook */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Linking.openURL('https://www.facebook.com/share/14XsWy5LpLM/')}
              style={{
                width: 56, height: 56, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(24,119,242,0.12)' : 'rgba(24,119,242,0.08)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(24,119,242,0.3)' : 'rgba(24,119,242,0.2)',
              }}
            >
              <Ionicons name="logo-facebook" size={26} color="#1877F2" />
            </TouchableOpacity>

            {/* Instagram */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Linking.openURL('https://www.instagram.com/adilagral?igsh=cWdiYmFlNzdzMDIz')}
              style={{
                width: 56, height: 56, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(228,64,95,0.12)' : 'rgba(228,64,95,0.08)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(228,64,95,0.3)' : 'rgba(228,64,95,0.2)',
              }}
            >
              <Ionicons name="logo-instagram" size={26} color="#E4405F" />
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Linking.openURL('https://wa.me/923489054973')}
              style={{
                width: 56, height: 56, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(37,211,102,0.12)' : 'rgba(37,211,102,0.08)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(37,211,102,0.3)' : 'rgba(37,211,102,0.2)',
              }}
            >
              <Ionicons name="logo-whatsapp" size={26} color="#25D366" />
            </TouchableOpacity>

            {/* Website / Globe */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => Linking.openURL('https://zamanmall.netlify.app')}
              style={{
                width: 56, height: 56, borderRadius: 18,
                alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDark ? 'rgba(29,185,84,0.12)' : 'rgba(29,185,84,0.08)',
                borderWidth: 1.5,
                borderColor: isDark ? 'rgba(29,185,84,0.3)' : 'rgba(29,185,84,0.2)',
              }}
            >
              <Ionicons name="globe-outline" size={26} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Footer text */}
          <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', marginTop: 18, letterSpacing: 1.5, textTransform: 'uppercase' }}>
            Zaman Mall © 2026
          </Text>
        </View>

      </ScrollView>

      {/* SORT MODAL & AIChatModal remain as they are */}


      {/* SORT MODAL */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 24 }} />
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 24 }}>Sort Products</Text>

            {(['Best Sellers', 'Price: Low to High', 'Price: High to Low'] as SortOption[]).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  setSortBy(option);
                  setIsSortModalVisible(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border
                }}
              >
                <Text style={{ color: sortBy === option ? colors.primary : colors.text, fontSize: 16, fontWeight: sortBy === option ? 'bold' : '500' }}>
                  {option}
                </Text>
                {sortBy === option && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <AIChatModal
        visible={isAIChatVisible}
        onClose={() => setIsAIChatVisible(false)}
      />

      {/* ── FLOATING SEARCH BUTTON ────────────────────────── */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 110,
          right: 20,
          opacity: fabAnim,
          transform: [
            { scale: Animated.multiply(fabAnim, fabPulse) },
            { translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [60, 0] }) },
          ],
          zIndex: 999,
        }}
      >
        {/* Glow ring */}
        <Animated.View
          style={{
            position: 'absolute',
            inset: -6,
            borderRadius: 999,
            backgroundColor: '#2563EB',
            opacity: fabPulse.interpolate({ inputRange: [1, 1.08], outputRange: [0.18, 0.35] }),
          }}
        />
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/search')}
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: '#2563EB',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.55,
            shadowRadius: 16,
            elevation: 10,
          }}
        >
          <Ionicons name="search" size={24} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </SafeScreen>
  );
};

export default ShopScreen;
