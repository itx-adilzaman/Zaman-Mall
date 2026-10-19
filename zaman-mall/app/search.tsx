import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import LottieView from "lottie-react-native";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Modal,
  Pressable,
  Alert,
  Share,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import SafeScreen from "../components/SafeScreen";
import { Product } from "../types/index";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from 'expo-image-picker';
import { renderProduct } from "../components/ProductsGrid";
import useWishlist from "../hooks/useWishlist";
import { supabase } from "../lib/supabase";
import { useCountrySession } from "../context/CountrySessionContext";

import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTheme } from "../context/ThemeContext";

const { width } = Dimensions.get("window");
const SEARCH_HISTORY_KEY = "@search_history";
const PAGE_SIZE = 20;

type CountryTab = 'pakistan' | 'china';

// ─── Animated Lazy Loader ─────────────────────────────────────────────────────
const LazyLoader = ({ colors }: { colors: any }) => {
  const allLetters = [
    { ch: "Z", color: "#E53935" },
    { ch: "A", color: "#1E88E5" },
    { ch: "M", color: "#43A047" },
    { ch: "A", color: "#FBD833" },
    { ch: "N", color: "#FB8C00" },
    { ch: " ", color: "transparent" },
    { ch: "M", color: "#E53935" },
    { ch: "A", color: "#1E88E5" },
    { ch: "L", color: "#43A047" },
    { ch: "L", color: "#FBD833" },
    { ch: " ", color: "transparent" },
    { ch: "L", color: "#FB8C00" },
    { ch: "O", color: "#E53935" },
    { ch: "A", color: "#1E88E5" },
    { ch: "D", color: "#43A047" },
    { ch: "I", color: "#FBD833" },
    { ch: "N", color: "#FB8C00" },
    { ch: "G", color: "#E53935" },
    { ch: ".", color: "#1E88E5" },
    { ch: ".", color: "#43A047" },
    { ch: ".", color: "#FBD833" },
  ];

  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      alignItems: "center",
      paddingVertical: 20,
      paddingBottom: 90,
      opacity: fadeIn,
      gap: 12,
    }}>
      <LottieView
        source={require("../assets/91cc0ece-1150-11ee-b7cb-d3afb5c0c001.json")}
        autoPlay
        loop
        style={{ width: 180, height: 90 }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {allLetters.map((item, i) => (
          <Text
            key={i}
            style={{ color: item.color, fontSize: 13, fontWeight: "900", letterSpacing: 1.5 }}
          >
            {item.ch}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
};

// ─── End-of-list indicator ────────────────────────────────────────────────────
const AllLoadedBadge = ({ colors, total }: { colors: any; total: number }) => (
  <View style={{ alignItems: "center", paddingVertical: 40, paddingBottom: 120 }}>
    <View style={{
      backgroundColor: colors.primary + "15",
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: colors.primary + "30",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    }}>
      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
      <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "700" }}>
        All {total} results loaded
      </Text>
    </View>
  </View>
);

type SortOption = "Best Sellers" | "Price: Low to High" | "Price: High to Low";

// ─── Per-country search state ─────────────────────────────────────────────────
interface CountrySearchState {
  products: Product[];
  totalCount: number;
  page: number;
  isInitialLoad: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const defaultState = (): CountrySearchState => ({
  products: [],
  totalCount: 0,
  page: 0,
  isInitialLoad: false,
  isLoadingMore: false,
  hasMore: false,
});

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { currentSession } = useCountrySession();
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } = useWishlist();

  // Active tab — default to current app session country
  const [activeTab, setActiveTab] = useState<CountryTab>(currentSession);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("Best Sellers");
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Separate state for each country
  const [pakistanState, setPakistanState] = useState<CountrySearchState>(defaultState());
  const [chinaState, setChinaState]       = useState<CountrySearchState>(defaultState());

  const flatListRef = useRef<FlatList>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tab slide animation
  const tabSlide = useRef(new Animated.Value(activeTab === 'pakistan' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(tabSlide, {
      toValue: activeTab === 'pakistan' ? 0 : 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 200,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    loadHistory();
    requestCameraPermission();
  }, []);

  // ── Helpers to get / set active country state ──────────────────────────────
  const getState = (tab: CountryTab) => tab === 'pakistan' ? pakistanState : chinaState;
  const setState = (tab: CountryTab, updater: (prev: CountrySearchState) => CountrySearchState) => {
    if (tab === 'pakistan') setPakistanState(updater);
    else setChinaState(updater);
  };

  // ── Fetch from Supabase for a specific country ─────────────────────────────
  const fetchProducts = useCallback(async (
    query: string,
    sort: SortOption,
    pageNum: number,
    reset: boolean,
    country: CountryTab,
  ) => {
    if (!query.trim()) return;

    if (reset) {
      setState(country, () => ({ ...defaultState(), isInitialLoad: true }));
    } else {
      setState(country, prev => ({ ...prev, isLoadingMore: true }));
    }

    try {
      const from = pageNum * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      let q = supabase
        .from("products")
        .select("*", { count: "exact" })
        .or(`name.ilike.%${query}%,category.ilike.%${query}%`)
        .eq("country", country)
        .range(from, to);

      if (sort === "Price: Low to High")      q = q.order("price", { ascending: true });
      else if (sort === "Price: High to Low") q = q.order("price", { ascending: false });
      else                                    q = q.order("name",  { ascending: true });

      const { data, count, error } = await q;
      if (error) throw error;

      const mapped = (data || []).map((item: any) => ({
        ...item,
        price: item.price || 0,
        averageRating: item.average_rating,
        totalReviews: item.total_reviews,
      })) as Product[];

      setState(country, prev => ({
        products:      reset ? mapped : [...prev.products, ...mapped],
        totalCount:    count ?? 0,
        page:          pageNum,
        hasMore:       (from + mapped.length) < (count ?? 0),
        isInitialLoad: false,
        isLoadingMore: false,
      }));
    } catch (e) {
      console.error("Search fetch error:", e);
      setState(country, prev => ({ ...prev, isInitialLoad: false, isLoadingMore: false }));
    }
  }, []);

  // ── Debounced search — fires for BOTH countries simultaneously ─────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!searchQuery.trim()) {
      setPakistanState(defaultState());
      setChinaState(defaultState());
      return;
    }
    debounceTimer.current = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      fetchProducts(searchQuery, sortBy, 0, true, 'pakistan');
      fetchProducts(searchQuery, sortBy, 0, true, 'china');
    }, 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [searchQuery, sortBy]);

  // ── Load more for active tab ───────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    const s = getState(activeTab);
    if (!s.hasMore || s.isLoadingMore || s.isInitialLoad) return;
    fetchProducts(searchQuery, sortBy, s.page + 1, false, activeTab);
  }, [activeTab, pakistanState, chinaState, searchQuery, sortBy, fetchProducts]);

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted" || libraryStatus !== "granted") {
      Alert.alert("Permission required", "Please grant camera and photo library permission for visual search");
    }
  };

  const handleVisualSearch = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      if (!result.canceled && result.assets[0]) {
        Alert.alert("Visual Search", "Image selected! Visual search feature will analyze this image to find similar products.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not select image");
    }
  };

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) { console.error("Failed to load history", e); }
  };

  const saveHistory = async (query: string) => {
    if (!query.trim()) return;
    const newHistory = [query, ...history.filter((h) => h !== query)].slice(0, 10);
    setHistory(newHistory);
    try {
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) { console.error("Failed to save history", e); }
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) saveHistory(query);
  };

  const handleShareProduct = async (product: Product) => {
    try {
      const productUrl = `https://zamanmall.netlify.app/product/${product.id}`;
      const shareMessage = `Check out this product on Zaman Mall!\n\n${product.name}\n\nPrice: Rs. ${product.price?.toLocaleString() || "0"}\n\n🔗 View here: ${productUrl}`.trim();
      await Share.share({ message: shareMessage, url: productUrl });
    } catch (error: any) { console.error("Error sharing product:", error); }
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const buildRows = (prods: Product[]) => {
    const paired: Product[][] = [];
    for (let i = 0; i < prods.length; i += 2) paired.push(prods.slice(i, i + 2));
    return paired;
  };

  const renderRow = ({ item }: { item: Product[] }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 0 }}>
      {item.map((product) => (
        <View key={product.id} style={{ width: "48.5%" }}>
          {renderProduct(
            product, colors, isDark,
            toggleWishlist, isInWishlist,
            isAddingToWishlist, isRemovingFromWishlist,
            handleShareProduct
          )}
        </View>
      ))}
      {item.length === 1 && <View style={{ width: "48.5%" }} />}
    </View>
  );

  const renderFooter = (tab: CountryTab) => {
    const s = getState(tab);
    if (s.hasMore || s.isLoadingMore) return <LazyLoader colors={colors} />;
    if (!s.hasMore && s.products.length > 0) return <AllLoadedBadge colors={colors} total={s.totalCount} />;
    return null;
  };

  // ── History / Empty screens ─────────────────────────────────────────────────
  const renderHistoryScreen = () => (
    <View style={{ paddingHorizontal: 24 }}>
      {history.length > 0 && (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>Recent Activity</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: "bold" }}>Clear History</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 32 }}>
            {history.map((item, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleSearch(item)}
                style={{ backgroundColor: colors.glassSurface, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorder, flexDirection: "row", alignItems: "center" }}
              >
                <Ionicons name="time-outline" size={16} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "500" }}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>Trending Now</Text>
      <View style={{ gap: 14 }}>
        {["iPhone 15 Pro Max", "AirPods Pro 2", "PlayStation 5", "Rolex Submariner"].map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleSearch(item)}
            style={{ backgroundColor: colors.glassSurface, padding: 20, borderRadius: 28, borderWidth: 1, borderColor: colors.glassBorder, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <LinearGradient colors={[colors.primary, colors.primary + "CC"]} style={{ width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                <Ionicons name="flash" size={20} color="#000" />
              </LinearGradient>
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "bold" }}>{item}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>Highly searched item</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward-circle-outline" size={24} color={isDark ? "#333" : "#CCC"} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderNoResults = (tab: CountryTab) => (
    <View style={{ alignItems: "center", paddingVertical: 80 }}>
      <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: colors.glassSurface, alignItems: "center", justifyContent: "center", marginBottom: 20, borderWidth: 1, borderColor: colors.glassBorder }}>
        <Ionicons name="search-outline" size={42} color={colors.textSecondary} />
      </View>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>No results found</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center" }}>
        No products found in {tab === 'pakistan' ? '🇵🇰 Pakistan' : '🇨🇳 China'} for "{searchQuery}"
      </Text>
    </View>
  );

  // ── Country Tab Bar ─────────────────────────────────────────────────────────
  const tabBarWidth = width - 48; // 24px padding each side
  const tabWidth    = tabBarWidth / 2;

  const renderCountryTabs = () => {
    const pkState = pakistanState;
    const cnState = chinaState;
    const hasQuery = searchQuery.trim().length > 0;

    return (
      <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
        <View style={{
          flexDirection: 'row',
          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderRadius: 18,
          padding: 4,
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Sliding background pill */}
          <Animated.View
            style={{
              position: 'absolute',
              top: 4,
              left: 4,
              width: tabWidth - 8,
              bottom: 4,
              borderRadius: 14,
              backgroundColor: activeTab === 'pakistan' ? '#16A34A' : '#DC2626',
              transform: [{
                translateX: tabSlide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, tabWidth],
                }),
              }],
              shadowColor: activeTab === 'pakistan' ? '#16A34A' : '#DC2626',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 4,
            }}
          />

          {/* Pakistan Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('pakistan')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              gap: 8,
              zIndex: 1,
            }}
          >
            <Image
              source={require('../assets/pakistan.png')}
              style={{ width: 28, height: 18, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }}
              resizeMode="cover"
            />
            <Text style={{
              color: activeTab === 'pakistan' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'),
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: 0.5,
            }}>
              Pakistan
            </Text>
            {hasQuery && (
              <View style={{
                backgroundColor: activeTab === 'pakistan' ? 'rgba(255,255,255,0.25)' : colors.glassSurface,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
                minWidth: 22,
                alignItems: 'center',
              }}>
                <Text style={{
                  color: activeTab === 'pakistan' ? '#fff' : colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '900',
                }}>
                  {pkState.isInitialLoad ? '…' : pkState.totalCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* China Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setActiveTab('china')}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 12,
              gap: 8,
              zIndex: 1,
            }}
          >
            <Image
              source={require('../assets/china.png')}
              style={{ width: 28, height: 18, borderRadius: 3, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.25)' }}
              resizeMode="cover"
            />
            <Text style={{
              color: activeTab === 'china' ? '#fff' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'),
              fontSize: 13,
              fontWeight: '800',
              letterSpacing: 0.5,
            }}>
              China
            </Text>
            {hasQuery && (
              <View style={{
                backgroundColor: activeTab === 'china' ? 'rgba(255,255,255,0.25)' : colors.glassSurface,
                paddingHorizontal: 7,
                paddingVertical: 2,
                borderRadius: 8,
                minWidth: 22,
                alignItems: 'center',
              }}>
                <Text style={{
                  color: activeTab === 'china' ? '#fff' : colors.textSecondary,
                  fontSize: 10,
                  fontWeight: '900',
                }}>
                  {cnState.isInitialLoad ? '…' : cnState.totalCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Active tab data ─────────────────────────────────────────────────────────
  const activeState   = getState(activeTab);
  const noQuery       = !searchQuery.trim();
  const noResults     = !noQuery && !activeState.isInitialLoad && activeState.products.length === 0;
  const activeRows    = useMemo(() => buildRows(activeState.products), [activeState.products]);

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Background glows */}
        <View style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: isDark ? "rgba(29,185,84,0.15)" : "rgba(29,185,84,0.05)" }} />
        <View style={{ position: "absolute", bottom: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: isDark ? "rgba(29,185,84,0.1)" : "rgba(29,185,84,0.03)" }} />

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginRight: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glassSurface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder }}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <View>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }}>Discover</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 2 }}>Zaman Mall Premium</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setIsSortModalVisible(true)}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.glassSurface, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.glassBorder }}
            >
              <Ionicons name="options-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={{ position: "relative" }}>
            <View style={{ position: "absolute", inset: -2, backgroundColor: "#2563EB", borderRadius: 24, opacity: isFocused ? 0.3 : 0 }} />
            <BlurView intensity={isDark ? 20 : 40} tint={colors.glassTint} style={{ backgroundColor: colors.glassSurface, borderWidth: 1, borderColor: isFocused ? "#2563EB" : colors.glassBorder, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderRadius: 22, overflow: "hidden" }}>
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: isFocused ? "#2563EB" : (isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"), alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Ionicons name="search" size={18} color={isFocused ? "#000" : colors.textSecondary} />
              </View>
              <TextInput
                placeholder="Search products in Pakistan & China..."
                placeholderTextColor={colors.textSecondary}
                style={{ flex: 1, fontSize: 15, fontWeight: "600", color: colors.text }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                autoFocus
                onSubmitEditing={() => handleSearch(searchQuery)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4, marginRight: 8 }}>
                  <Ionicons name="close-circle" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity style={{ padding: 8, marginLeft: 4 }} onPress={handleVisualSearch}>
                <Ionicons name="camera" size={22} color={isFocused ? "#2563EB" : colors.textSecondary} />
              </TouchableOpacity>
            </BlurView>
          </View>
        </View>

        {/* Country Tab Bar — always visible */}
        {renderCountryTabs()}

        {/* Body */}
        {noQuery ? (
          <FlatList
            data={[]}
            renderItem={null}
            ListHeaderComponent={renderHistoryScreen}
            keyExtractor={() => "history"}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        ) : activeState.isInitialLoad ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 }}>
            <LazyLoader colors={colors} />
          </View>
        ) : noResults ? (
          renderNoResults(activeTab)
        ) : (
          <>
            {/* Results header */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingHorizontal: 24 }}>
              <View>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "900" }}>
                  {activeTab === 'pakistan' ? '🇵🇰 Pakistan' : '🇨🇳 China'} Results
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10 }}>{sortBy}</Text>
              </View>
              <View style={{ backgroundColor: colors.primary + "20", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "900" }}>
                  {activeState.products.length}/{activeState.totalCount} ITEMS
                </Text>
              </View>
            </View>

            {/* Product grid */}
            <FlatList
              ref={flatListRef}
              data={activeRows}
              renderItem={renderRow}
              keyExtractor={(_, index) => `${activeTab}-row-${index}`}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.8}
              ListFooterComponent={() => renderFooter(activeTab)}
              removeClippedSubviews
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </>
        )}

        {/* Sort Modal */}
        <Modal
          visible={isSortModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsSortModalVisible(false)}
        >
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
            onPress={() => setIsSortModalVisible(false)}
          >
            <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
              <View style={{ width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 24 }} />
              <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: 24 }}>Sort Results</Text>
              {(["Best Sellers", "Price: Low to High", "Price: High to Low"] as SortOption[]).map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => { setSortBy(option); setIsSortModalVisible(false); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: colors.border }}
                >
                  <Text style={{ color: sortBy === option ? colors.primary : colors.text, fontSize: 16, fontWeight: sortBy === option ? "bold" : "500" }}>
                    {option}
                  </Text>
                  {sortBy === option && <Ionicons name="checkmark-circle" size={24} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Modal>
      </View>
    </SafeScreen>
  );
}
