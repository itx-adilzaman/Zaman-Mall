/**
 * Affiliate Products — Full Screen with Lazy Loading
 * Route: /affiliate-products
 *
 * Same lazy-loading pattern as Search screen:
 * - PAGE_SIZE based pagination from Supabase
 * - FlatList onEndReached triggers next page
 * - LazyLoader (Lottie + colored letters) while fetching
 * - AllLoadedBadge when list is exhausted
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  Dimensions,
  StatusBar,
  Animated,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import LottieView from "lottie-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateBrands from "@/hooks/useAffiliateBrands";
import { supabase } from "@/lib/supabase";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W   = (SCREEN_W - 48) / 2;   // 16px left + 16px right + 16px gap
const ACCENT   = "#6366f1";
const PAGE_SIZE = 10;                    // products per page

// ── Types ─────────────────────────────────────────────────────────────────────
interface AffiliateProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url: string;
  images: string[];
  affiliate_url: string;
  brand_id?: string | null;
  brand_name?: string | null;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

interface LoadState {
  products: AffiliateProduct[];
  totalCount: number;
  page: number;
  isInitialLoad: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const defaultState = (): LoadState => ({
  products:      [],
  totalCount:    0,
  page:          0,
  isInitialLoad: false,
  isLoadingMore: false,
  hasMore:       false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const openLink = async (url: string, name: string) => {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert("Error", `${name} ka link nahi khul saka`);
  } catch {
    Alert.alert("Error", "Link open karne mein masla hua");
  }
};

const fmtPrice = (price: number) =>
  price > 0 ? `Rs. ${price.toLocaleString()}` : null;

// ── LazyLoader — same animated style as Search screen ────────────────────────
const LazyLoader = ({ colors }: { colors: any }) => {
  const letters = [
    { ch: "L", color: "#E53935" }, { ch: "O", color: "#1E88E5" },
    { ch: "A", color: "#43A047" }, { ch: "D", color: "#FBD833" },
    { ch: "I", color: "#FB8C00" }, { ch: "N", color: "#E53935" },
    { ch: "G", color: "#1E88E5" }, { ch: " ", color: "transparent" },
    { ch: ".", color: "#43A047" }, { ch: ".", color: "#FBD833" },
    { ch: ".", color: "#FB8C00" },
  ];
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={{
      alignItems: "center", paddingVertical: 24, paddingBottom: 40, opacity: fadeIn, gap: 10,
    }}>
      <LottieView
        source={require("../assets/91cc0ece-1150-11ee-b7cb-d3afb5c0c001.json")}
        autoPlay
        loop
        style={{ width: 180, height: 90 }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {letters.map((item, i) => (
          <Text key={i} style={{
            color: item.color, fontSize: 13, fontWeight: "900", letterSpacing: 1.5,
          }}>
            {item.ch}
          </Text>
        ))}
      </View>
    </Animated.View>
  );
};

// ── AllLoadedBadge ────────────────────────────────────────────────────────────
const AllLoadedBadge = ({ total }: { total: number }) => (
  <View style={{ alignItems: "center", paddingVertical: 36, paddingBottom: 110 }}>
    <View style={{
      backgroundColor: `${ACCENT}15`,
      paddingHorizontal: 20, paddingVertical: 12,
      borderRadius: 24,
      borderWidth: 1, borderColor: `${ACCENT}30`,
      flexDirection: "row", alignItems: "center", gap: 8,
    }}>
      <Ionicons name="checkmark-circle" size={18} color={ACCENT} />
      <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "700" }}>
        All {total} products loaded
      </Text>
    </View>
  </View>
);

// ── Product Card ──────────────────────────────────────────────────────────────
const ProductCard = React.memo(({
  product, colors, isDark, brandLogo,
}: {
  product: AffiliateProduct;
  colors: any;
  isDark: boolean;
  brandLogo?: string;
}) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={() => router.push(`/affiliate-product/${product.id}`)}
    style={{
      width: CARD_W,
      backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
      borderRadius: 18,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.28 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    }}
  >
    {/* Image */}
    <View style={{ position: "relative" }}>
      <ExpoImage
        source={{ uri: product.image_url }}
        style={{ width: "100%", height: CARD_W * 0.88 }}
        contentFit="cover"
        transition={200}
      />
      {/* Featured */}
      {product.is_featured && (
        <View style={{
          position: "absolute", top: 8, left: 8,
          flexDirection: "row", alignItems: "center", gap: 3,
          backgroundColor: "rgba(245,158,11,0.95)",
          paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999,
        }}>
          <Ionicons name="star" size={9} color="#000" />
          <Text style={{ color: "#000", fontSize: 9, fontWeight: "900" }}>Top Pick</Text>
        </View>
      )}
      {/* Brand logo or text */}
      {brandLogo ? (
        <View style={{
          position: "absolute", bottom: 8, right: 8,
          width: 26, height: 26, borderRadius: 8,
          backgroundColor: "#fff",
          alignItems: "center", justifyContent: "center",
          padding: 3,
          borderWidth: 1, borderColor: "rgba(0,0,0,0.08)",
        }}>
          <ExpoImage
            source={{ uri: brandLogo }}
            style={{ width: "100%", height: "100%" }}
            contentFit="contain"
          />
        </View>
      ) : product.brand_name ? (
        <View style={{
          position: "absolute", bottom: 8, right: 8,
          backgroundColor: "rgba(0,0,0,0.65)",
          paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
        }}>
          <Text style={{ color: "rgba(255,255,255,0.92)", fontSize: 9, fontWeight: "700" }}>
            {product.brand_name}
          </Text>
        </View>
      ) : null}
      {/* Category */}
      <View style={{
        position: "absolute", top: 8, right: 8,
        backgroundColor: `${ACCENT}D9`,
        paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6,
      }}>
        <Text style={{ color: "#fff", fontSize: 8, fontWeight: "800", textTransform: "uppercase" }}>
          {product.category}
        </Text>
      </View>
    </View>

    {/* Info */}
    <View style={{ padding: 10, gap: 3 }}>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700", lineHeight: 16 }}
        numberOfLines={2}>
        {product.name}
      </Text>

      {fmtPrice(product.price) && (
        <Text style={{ color: ACCENT, fontSize: 13, fontWeight: "900" }}>
          {fmtPrice(product.price)}
        </Text>
      )}

      {product.description ? (
        <Text style={{ color: colors.textSecondary, fontSize: 10, lineHeight: 14 }}
          numberOfLines={2}>
          {product.description}
        </Text>
      ) : null}

      {/* Buttons row */}
      <View style={{ flexDirection: "row", gap: 6, marginTop: 6 }}>
        {/* Details */}
        <TouchableOpacity
          onPress={() => router.push(`/affiliate-product/${product.id}`)}
          activeOpacity={0.8}
          style={{
            flex: 1,
            backgroundColor: isDark ? `${ACCENT}18` : `${ACCENT}0D`,
            paddingVertical: 8, borderRadius: 11,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3,
            borderWidth: 1, borderColor: `${ACCENT}30`,
          }}
        >
          <Ionicons name="eye-outline" size={12} color={ACCENT} />
          <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}>Details</Text>
        </TouchableOpacity>

        {/* Order */}
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); openLink(product.affiliate_url, product.name); }}
          activeOpacity={0.8}
          style={{
            flex: 1,
            backgroundColor: ACCENT, paddingVertical: 8, borderRadius: 11,
            flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3,
            shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.28, shadowRadius: 6, elevation: 2,
          }}
        >
          <Ionicons name="cart" size={12} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>Order</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
));

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = ({ isDark }: { isDark: boolean }) => (
  <View style={{
    width: CARD_W,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: isDark ? "#1A1A1A" : "#F0F0F0",
  }}>
    <View style={{ width: "100%", height: CARD_W * 0.88, backgroundColor: isDark ? "#252525" : "#E5E5E5" }} />
    <View style={{ padding: 10, gap: 6 }}>
      <View style={{ height: 12, borderRadius: 6, backgroundColor: isDark ? "#252525" : "#E5E5E5", width: "80%" }} />
      <View style={{ height: 12, borderRadius: 6, backgroundColor: isDark ? "#252525" : "#E5E5E5", width: "55%" }} />
      <View style={{ height: 10, borderRadius: 5, backgroundColor: isDark ? "#252525" : "#E8E8E8", width: "70%" }} />
      <View style={{ height: 32, borderRadius: 11, backgroundColor: isDark ? "#252525" : "#E5E5E5", marginTop: 4 }} />
    </View>
  </View>
);

// ── Row wrapper for 2-column grid ─────────────────────────────────────────────
type ProductRow = { id: string; left: AffiliateProduct; right?: AffiliateProduct };

const buildRows = (products: AffiliateProduct[]): ProductRow[] => {
  const rows: ProductRow[] = [];
  for (let i = 0; i < products.length; i += 2) {
    rows.push({ id: `row-${i}`, left: products[i], right: products[i + 1] });
  }
  return rows;
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AffiliateProductsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { brands } = useAffiliateBrands();

  const [state, setState]           = useState<LoadState>(defaultState());
  const [search, setSearch]         = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [allCategories, setAllCategories] = useState<string[]>(["All"]);

  const flatListRef = useRef<FlatList>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // brand logo lookup map
  const brandLogoMap = useMemo(() =>
    Object.fromEntries(brands.map(b => [b.id, b.logo_url])),
    [brands]
  );

  // ── Fetch categories once ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("category")
        .eq("is_active", true);
      if (data) {
        const cats = Array.from(new Set(data.map((r: any) => r.category).filter(Boolean)));
        setAllCategories(["All", ...cats]);
      }
    })();
  }, []);

  // ── Core fetch function ────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (
    query: string,
    category: string,
    pageNum: number,
    reset: boolean,
  ) => {
    if (reset) {
      setState(() => ({ ...defaultState(), isInitialLoad: true }));
    } else {
      setState(prev => ({ ...prev, isLoadingMore: true }));
    }

    try {
      const from = pageNum * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      let q = supabase
        .from("affiliate_products")
        .select("*", { count: "exact" })
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .range(from, to);

      // Search filter
      if (query.trim()) {
        q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%,brand_name.ilike.%${query}%,category.ilike.%${query}%`);
      }

      // Category filter
      if (category !== "All") {
        q = q.eq("category", category);
      }

      const { data, count, error } = await q;
      if (error) throw error;

      const products = (data || []) as AffiliateProduct[];

      setState(prev => ({
        products:      reset ? products : [...prev.products, ...products],
        totalCount:    count ?? 0,
        page:          pageNum,
        hasMore:       (from + products.length) < (count ?? 0),
        isInitialLoad: false,
        isLoadingMore: false,
      }));
    } catch (err) {
      console.error("[AffiliateProducts] fetch error:", err);
      setState(prev => ({ ...prev, isInitialLoad: false, isLoadingMore: false }));
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchProducts("", "All", 0, true);
  }, [fetchProducts]);

  // ── Debounced search / filter ──────────────────────────────────────────────
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      fetchProducts(search, selectedCat, 0, true);
    }, 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [search, selectedCat, fetchProducts]);

  // ── Load more ──────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (!state.hasMore || state.isLoadingMore || state.isInitialLoad) return;
    fetchProducts(search, selectedCat, state.page + 1, false);
  }, [state, search, selectedCat, fetchProducts]);

  // ── Rows for FlatList ──────────────────────────────────────────────────────
  const rows = useMemo(() => buildRows(state.products), [state.products]);

  // ── Render row ─────────────────────────────────────────────────────────────
  const renderRow = useCallback(({ item }: { item: ProductRow }) => (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16, paddingHorizontal: 16 }}>
      <ProductCard
        product={item.left}
        colors={colors}
        isDark={isDark}
        brandLogo={item.left.brand_id ? brandLogoMap[item.left.brand_id] : undefined}
      />
      {item.right ? (
        <ProductCard
          product={item.right}
          colors={colors}
          isDark={isDark}
          brandLogo={item.right.brand_id ? brandLogoMap[item.right.brand_id] : undefined}
        />
      ) : (
        <View style={{ width: CARD_W }} />
      )}
    </View>
  ), [colors, isDark, brandLogoMap]);

  // ── Footer component ───────────────────────────────────────────────────────
  const ListFooter = useCallback(() => {
    if (state.isLoadingMore) return <LazyLoader colors={colors} />;
    if (!state.hasMore && state.products.length > 0) {
      return <AllLoadedBadge total={state.totalCount} />;
    }
    return <View style={{ height: 110 }} />;
  }, [state.isLoadingMore, state.hasMore, state.products.length, state.totalCount, colors]);

  // ── Header: search + category pills ───────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
        style={{ borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)" }}
      >
        {allCategories.map((cat) => {
          const isActive = selectedCat === cat;
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCat(cat)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: 999,
                backgroundColor: isActive ? ACCENT : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)"),
                borderWidth: 1, borderColor: isActive ? ACCENT : "transparent",
              }}
            >
              <Text style={{
                color: isActive ? "#fff" : colors.textSecondary,
                fontSize: 12, fontWeight: isActive ? "800" : "600",
              }}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results count row */}
      {!state.isInitialLoad && state.products.length > 0 && (
        <View style={{
          flexDirection: "row", alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
        }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>
            {selectedCat === "All" ? "All Products" : selectedCat}
          </Text>
          <View style={{
            backgroundColor: `${ACCENT}18`,
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 10, borderWidth: 1, borderColor: `${ACCENT}30`,
          }}>
            <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "900" }}>
              {state.products.length}/{state.totalCount} loaded
            </Text>
          </View>
        </View>
      )}
    </View>
  ), [allCategories, selectedCat, isDark, colors, state.isInitialLoad, state.products.length, state.totalCount]);

  // ── Empty state ────────────────────────────────────────────────────────────
  const ListEmpty = useCallback(() => {
    if (state.isInitialLoad) return null; // loading skeleton shown separately
    return (
      <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 70, paddingHorizontal: 32 }}>
        <View style={{
          width: 72, height: 72, borderRadius: 20,
          backgroundColor: `${ACCENT}12`,
          alignItems: "center", justifyContent: "center", marginBottom: 16,
        }}>
          <Ionicons name="storefront-outline" size={32} color={ACCENT} />
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
          {search ? "Koi product nahi mila" : "Abhi koi product nahi"}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
          {search
            ? `"${search}" se match nahi hua`
            : "Admin panel se affiliate products add karein"}
        </Text>
      </View>
    );
  }, [state.isInitialLoad, search, colors]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />

      {/* ── Fixed Header ─────────────────────────────────── */}
      <View style={{
        paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      }}>
        {/* Title row */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.7}
            style={{
              width: 38, height: 38, borderRadius: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", letterSpacing: -0.4 }}>
              Affiliate Products
            </Text>
            <Text style={{ color: ACCENT, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
              {state.isInitialLoad ? "Loading..." : `${state.totalCount} products`}
            </Text>
          </View>

          <View style={{
            backgroundColor: `${ACCENT}12`, paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 10, borderWidth: 1, borderColor: `${ACCENT}25`,
          }}>
            <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "800" }}>
              {state.isInitialLoad ? "..." : state.totalCount} total
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: "row", alignItems: "center",
          backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
          borderRadius: 14, borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)",
          paddingHorizontal: 12, paddingVertical: 10, gap: 10,
        }}>
          <Ionicons name="search" size={17} color={colors.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Product, brand, category search karein..."
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, color: colors.text, fontSize: 13, fontWeight: "500" }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={17} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Initial skeleton loading ─────────────────────── */}
      {state.isInitialLoad ? (
        <View style={{ flex: 1 }}>
          {/* Category pills skeleton */}
          <View style={{
            flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 12,
            borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          }}>
            {[80, 90, 70, 95, 75].map((w, i) => (
              <View key={i} style={{
                width: w, height: 32, borderRadius: 999,
                backgroundColor: isDark ? "#1E1E1E" : "#EFEFEF",
              }} />
            ))}
          </View>
          {/* Product skeletons in 2-col grid */}
          <View style={{ padding: 16, flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} isDark={isDark} />)}
          </View>
          {/* Lottie loader */}
          <LazyLoader colors={colors} />
        </View>
      ) : (
        /* ── Product FlatList ─────────────────────────────── */
        <FlatList
          ref={flatListRef}
          data={rows}
          renderItem={renderRow}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8 }}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.6}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          getItemLayout={(_, index) => ({
            length: CARD_W * 1.55 + 16,
            offset: (CARD_W * 1.55 + 16) * index,
            index,
          })}
        />
      )}
    </View>
  );
}
