/**
 * Affiliate Brands — Full Screen
 * Route: /affiliate-brands
 *
 * All brands in a nice grid, search, category filter,
 * transparent PNG-friendly logos, Order button.
 */
import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateBrands, { AffiliateBrand } from "@/hooks/useAffiliateBrands";

const { width: SCREEN_W } = Dimensions.get("window");

// 2-column grid
const GAP    = 14;
const PAD    = 16;
const CARD_W = (SCREEN_W - PAD * 2 - GAP) / 2;
const LOGO_S = CARD_W * 0.62;

const AMBER  = "#f59e0b";

const CATEGORY_COLORS: Record<string, string> = {
  Shopping:    "#f59e0b",
  Electronics: "#3b82f6",
  Fashion:     "#ec4899",
  Wholesale:   "#8b5cf6",
  Groceries:   "#10b981",
  Gadgets:     "#06b6d4",
  Home:        "#f97316",
  General:     "#6b7280",
};

const catColor = (cat: string) => CATEGORY_COLORS[cat] ?? "#6b7280";

// ── helpers ───────────────────────────────────────────────────────────────────
const openLink = async (url: string, name: string) => {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert("Error", `${name} ka link nahi khul saka`);
  } catch {
    Alert.alert("Error", "Link open karne mein masla hua");
  }
};

// ── Brand card (2-col grid) ───────────────────────────────────────────────────
const BrandCard = React.memo(({
  brand,
  colors,
  isDark,
}: {
  brand: AffiliateBrand;
  colors: any;
  isDark: boolean;
}) => {
  const cc = catColor(brand.category);

  return (
    <TouchableOpacity
      activeOpacity={0.82}
      onPress={() => openLink(brand.affiliate_url, brand.name)}
      style={{
        width: CARD_W,
        backgroundColor: isDark ? "#181818" : "#FFFFFF",
        borderRadius: 22,
        paddingTop: 20,
        paddingBottom: 14,
        paddingHorizontal: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.25 : 0.07,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Category dot */}
      <View style={{
        position: "absolute", top: 12, right: 12,
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: cc,
      }} />

      {/* Logo — no white box, transparent */}
      <ExpoImage
        source={{ uri: brand.logo_url }}
        style={{ width: LOGO_S, height: LOGO_S, marginBottom: 12 }}
        contentFit="contain"
        transition={250}
      />

      {/* Brand name */}
      <Text style={{
        color: colors.text,
        fontSize: 13, fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.2,
        marginBottom: 2,
      }} numberOfLines={1}>
        {brand.name}
      </Text>

      {/* Urdu name */}
      {brand.name_urdu ? (
        <Text style={{
          color: colors.textSecondary,
          fontSize: 11, textAlign: "center",
          marginBottom: 6,
        }} numberOfLines={1}>
          {brand.name_urdu}
        </Text>
      ) : <View style={{ marginBottom: 6 }} />}

      {/* Category pill */}
      <View style={{
        flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: `${cc}15`,
        paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: 999,
        borderWidth: 1, borderColor: `${cc}30`,
        marginBottom: 12,
      }}>
        <Ionicons name="pricetag" size={9} color={cc} />
        <Text style={{
          color: cc, fontSize: 9, fontWeight: "800",
          textTransform: "uppercase", letterSpacing: 0.6,
        }}>
          {brand.category}
        </Text>
      </View>

      {/* Order button */}
      <TouchableOpacity
        onPress={() => openLink(brand.affiliate_url, brand.name)}
        activeOpacity={0.8}
        style={{
          width: "100%",
          backgroundColor: cc,
          paddingVertical: 10,
          borderRadius: 14,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          shadowColor: cc,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Ionicons name="cart" size={14} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "800" }}>Order</Text>
        <Ionicons name="open-outline" size={11} color="rgba(255,255,255,0.75)" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = ({ isDark }: { isDark: boolean }) => (
  <View style={{
    width: CARD_W, borderRadius: 22, alignItems: "center",
    paddingTop: 20, paddingBottom: 14, paddingHorizontal: 12,
    backgroundColor: isDark ? "#181818" : "#F5F5F5",
    borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  }}>
    <View style={{
      width: LOGO_S, height: LOGO_S, borderRadius: 14, marginBottom: 12,
      backgroundColor: isDark ? "#252525" : "#E8E8E8",
    }} />
    <View style={{ width: "70%", height: 13, borderRadius: 6, backgroundColor: isDark ? "#252525" : "#E5E5E5", marginBottom: 8 }} />
    <View style={{ width: "45%", height: 10, borderRadius: 5, backgroundColor: isDark ? "#252525" : "#EBEBEB", marginBottom: 12 }} />
    <View style={{ width: "100%", height: 36, borderRadius: 14, backgroundColor: isDark ? "#252525" : "#E5E5E5" }} />
  </View>
);

// ── Row pair type ─────────────────────────────────────────────────────────────
type BrandRow = { id: string; left: AffiliateBrand; right?: AffiliateBrand };
const toRows = (brands: AffiliateBrand[]): BrandRow[] => {
  const rows: BrandRow[] = [];
  for (let i = 0; i < brands.length; i += 2) {
    rows.push({ id: `r${i}`, left: brands[i], right: brands[i + 1] });
  }
  return rows;
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AffiliateBrandsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { brands, grouped, isLoading, refetch } = useAffiliateBrands();

  const [search, setSearch]       = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [refreshing, setRefreshing]   = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const categories = useMemo(() => ["All", ...Object.keys(grouped)], [grouped]);

  const filtered = useMemo(() => {
    return brands.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        b.name.toLowerCase().includes(q) ||
        (b.name_urdu ?? "").toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q);
      const matchCat = selectedCat === "All" || b.category === selectedCat;
      return matchSearch && matchCat;
    });
  }, [brands, search, selectedCat]);

  const rows = useMemo(() => toRows(filtered), [filtered]);

  // ── render row ──────────────────────────────────────────────────────────────
  const renderRow = useCallback(({ item }: { item: BrandRow }) => (
    <View style={{
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: PAD,
      marginBottom: GAP,
    }}>
      <BrandCard brand={item.left} colors={colors} isDark={isDark} />
      {item.right
        ? <BrandCard brand={item.right} colors={colors} isDark={isDark} />
        : <View style={{ width: CARD_W }} />
      }
    </View>
  ), [colors, isDark]);

  // ── header ──────────────────────────────────────────────────────────────────
  const ListHeader = useCallback(() => (
    <View>
      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: PAD, paddingVertical: 12, gap: 8 }}
        style={{
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
        }}
      >
        {categories.map(cat => {
          const isActive = selectedCat === cat;
          const cc = cat === "All" ? AMBER : catColor(cat);
          return (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCat(cat)}
              activeOpacity={0.75}
              style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: isActive
                  ? `${cc}18`
                  : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
                borderWidth: 1,
                borderColor: isActive ? `${cc}40` : "transparent",
              }}
            >
              <Ionicons
                name={cat === "All" ? "apps" : "pricetag"}
                size={11}
                color={isActive ? cc : colors.textSecondary}
              />
              <Text style={{
                color: isActive ? cc : colors.textSecondary,
                fontSize: 12,
                fontWeight: isActive ? "800" : "600",
              }}>
                {cat}
              </Text>
              {/* Count badge */}
              {cat !== "All" && (
                <View style={{
                  backgroundColor: isActive ? `${cc}25` : "transparent",
                  paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6,
                }}>
                  <Text style={{
                    color: isActive ? cc : colors.textSecondary,
                    fontSize: 9, fontWeight: "900",
                  }}>
                    {grouped[cat]?.length ?? 0}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results row */}
      {!isLoading && filtered.length > 0 && (
        <View style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingHorizontal: PAD, paddingTop: 14, paddingBottom: 6,
        }}>
          <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>
            {selectedCat === "All" ? "All Brands" : selectedCat}
          </Text>
          <View style={{
            backgroundColor: "rgba(245,158,11,0.1)",
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 10, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
          }}>
            <Text style={{ color: AMBER, fontSize: 11, fontWeight: "900" }}>
              {filtered.length} brands
            </Text>
          </View>
        </View>
      )}
    </View>
  ), [categories, selectedCat, isDark, colors, isLoading, filtered.length, grouped]);

  // ── empty ───────────────────────────────────────────────────────────────────
  const ListEmpty = useCallback(() => (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 70, paddingHorizontal: 32 }}>
      <View style={{
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: "rgba(245,158,11,0.1)",
        alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Ionicons name="bag-outline" size={32} color={AMBER} />
      </View>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 6 }}>
        {search ? "Koi brand nahi mila" : "Abhi koi brand nahi"}
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
        {search
          ? `"${search}" se koi brand match nahi hua`
          : "Admin panel se affiliate brands add karein"}
      </Text>
    </View>
  ), [search, colors]);

  // ── footer ──────────────────────────────────────────────────────────────────
  const ListFooter = useCallback(() => (
    <View style={{ height: insets.bottom + 110 }} />
  ), [insets.bottom]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />

      {/* ── Fixed Header ─────────────────────────────────── */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: PAD,
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
              Affiliate Brands
            </Text>
            <Text style={{ color: AMBER, fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 }}>
              {isLoading ? "Loading..." : `${brands.length} brands`}
            </Text>
          </View>

          <View style={{
            backgroundColor: "rgba(245,158,11,0.1)",
            paddingHorizontal: 10, paddingVertical: 5,
            borderRadius: 10, borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
          }}>
            <Text style={{ color: AMBER, fontSize: 11, fontWeight: "800" }}>
              {isLoading ? "..." : brands.length} total
            </Text>
          </View>
        </View>

        {/* Search */}
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
            placeholder="Brand name, category search karein..."
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

      {/* ── Loading skeleton ─────────────────────────────── */}
      {isLoading ? (
        <View style={{ padding: PAD }}>
          {/* Pill skeletons */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
            {[60, 90, 75, 85, 65].map((w, i) => (
              <View key={i} style={{
                width: w, height: 32, borderRadius: 999,
                backgroundColor: isDark ? "#1E1E1E" : "#EFEFEF",
              }} />
            ))}
          </View>
          {/* Card skeletons */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GAP }}>
            {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} isDark={isDark} />)}
          </View>
          <ActivityIndicator color={AMBER} style={{ marginTop: 24 }} />
        </View>
      ) : (
        /* ── FlatList grid ─────────────────────────────── */
        <FlatList
          data={rows}
          renderItem={renderRow}
          keyExtractor={item => item.id}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={ListEmpty}
          ListFooterComponent={ListFooter}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={AMBER}
            />
          }
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
        />
      )}
    </View>
  );
}
