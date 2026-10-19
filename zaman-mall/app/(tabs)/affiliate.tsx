import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateBrands, { AffiliateBrand } from "@/hooks/useAffiliateBrands";
import SafeScreen from "@/components/SafeScreen";

const { width: SCREEN_W } = Dimensions.get("window");

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Shopping:    { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.3)" },
  Electronics: { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.3)" },
  Fashion:     { bg: "rgba(236,72,153,0.12)", text: "#ec4899", border: "rgba(236,72,153,0.3)" },
  Wholesale:   { bg: "rgba(139,92,246,0.12)", text: "#8b5cf6", border: "rgba(139,92,246,0.3)" },
  Groceries:   { bg: "rgba(16,185,129,0.12)", text: "#10b981", border: "rgba(16,185,129,0.3)" },
  Gadgets:     { bg: "rgba(6,182,212,0.12)",  text: "#06b6d4", border: "rgba(6,182,212,0.3)"  },
  Home:        { bg: "rgba(249,115,22,0.12)", text: "#f97316", border: "rgba(249,115,22,0.3)" },
  General:     { bg: "rgba(107,114,128,0.12)",text: "#6b7280", border: "rgba(107,114,128,0.3)"},
};

const getCategory = (cat: string) =>
  CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["General"];

// ── Brand Card ────────────────────────────────────────────────────────────────
const BrandCard = ({
  brand,
  colors,
  isDark,
}: {
  brand: AffiliateBrand;
  colors: any;
  isDark: boolean;
}) => {
  const catStyle = getCategory(brand.category);

  const handleOrder = useCallback(async () => {
    const url = brand.affiliate_url;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert(
        "Link nahi khul saka",
        `Ye link open karne mein masla hua:\n${url}`,
        [{ text: "OK" }]
      );
    }
  }, [brand.affiliate_url]);

  return (
    <View
      style={{
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        shadowColor: isDark ? "#000" : "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        {/* Logo */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
            alignItems: "center",
            justifyContent: "center",
            padding: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Image
            source={{ uri: brand.logo_url }}
            style={{ width: "100%", height: "100%", borderRadius: 8 }}
            resizeMode="contain"
            defaultSource={{ uri: `https://placehold.co/64x64/f59e0b/fff?text=${brand.name[0]}` }}
          />
        </View>

        {/* Info */}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "800",
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {brand.name}
            </Text>
            {brand.name_urdu ? (
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 11,
                  fontWeight: "500",
                }}
              >
                {brand.name_urdu}
              </Text>
            ) : null}
          </View>

          {/* Category tag */}
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: catStyle.bg,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: catStyle.border,
              marginTop: 4,
              marginBottom: 4,
            }}
          >
            <Ionicons name="pricetag" size={9} color={catStyle.text} />
            <Text
              style={{
                color: catStyle.text,
                fontSize: 9,
                fontWeight: "800",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {brand.category}
            </Text>
          </View>

          {brand.description ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 11,
                lineHeight: 16,
              }}
              numberOfLines={2}
            >
              {brand.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
          marginVertical: 12,
        }}
      />

      {/* Order Button */}
      <TouchableOpacity
        onPress={handleOrder}
        activeOpacity={0.82}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          backgroundColor: catStyle.text,
          paddingVertical: 12,
          borderRadius: 14,
          shadowColor: catStyle.text,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 5,
        }}
      >
        <Ionicons name="cart" size={18} color="#fff" />
        <Text
          style={{
            color: "#fff",
            fontSize: 15,
            fontWeight: "800",
            letterSpacing: 0.3,
          }}
        >
          Order karo — {brand.name}
        </Text>
        <Ionicons name="open-outline" size={14} color="rgba(255,255,255,0.75)" />
      </TouchableOpacity>
    </View>
  );
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({
  category,
  count,
  colors,
}: {
  category: string;
  count: number;
  colors: any;
}) => {
  const catStyle = getCategory(category);
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
        marginTop: 4,
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: catStyle.bg,
          borderWidth: 1,
          borderColor: catStyle.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="pricetag" size={13} color={catStyle.text} />
      </View>
      <Text
        style={{
          color: colors.text,
          fontSize: 14,
          fontWeight: "800",
          letterSpacing: -0.2,
        }}
      >
        {category}
      </Text>
      <View
        style={{
          backgroundColor: catStyle.bg,
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: catStyle.border,
        }}
      >
        <Text
          style={{ color: catStyle.text, fontSize: 10, fontWeight: "900" }}
        >
          {count}
        </Text>
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AffiliateScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { brands, grouped, isLoading, refetch } = useAffiliateBrands();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCat, setSelectedCat] = useState("All");

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Filter brands
  const filtered = brands.filter((b) => {
    const matchSearch =
      !search ||
      b.name.toLowerCase().includes(search.toLowerCase()) ||
      (b.name_urdu ?? "").toLowerCase().includes(search.toLowerCase()) ||
      b.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === "All" || b.category === selectedCat;
    return matchSearch && matchCat;
  });

  // Grouped filtered
  const filteredGrouped = filtered.reduce<Record<string, AffiliateBrand[]>>(
    (acc, brand) => {
      const cat = brand.category || "General";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(brand);
      return acc;
    },
    {}
  );

  const categories = ["All", ...Object.keys(grouped)];

  return (
    <SafeScreen>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: insets.top + 8,
        }}
      >
        {/* ── Top Header ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "rgba(245,158,11,0.12)",
                borderWidth: 1,
                borderColor: "rgba(245,158,11,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="bag" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 22,
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                Affiliate Brands
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "500",
                }}
              >
                Top brands — direct order karein
              </Text>
            </View>
          </View>

          {/* Total count badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(245,158,11,0.08)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: "rgba(245,158,11,0.2)",
              alignSelf: "flex-start",
            }}
          >
            <Ionicons name="storefront" size={13} color="#f59e0b" />
            <Text
              style={{ color: "#f59e0b", fontSize: 11, fontWeight: "800" }}
            >
              {brands.length} brands available
            </Text>
          </View>
        </View>

        {/* ── Search Bar ─────────────────────────────────── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: isDark ? "#1A1A1A" : "#F5F5F5",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: isDark
                ? "rgba(255,255,255,0.1)"
                : "rgba(0,0,0,0.08)",
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 10,
            }}
          >
            <Ionicons
              name="search"
              size={18}
              color={colors.textSecondary}
            />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Brand search karein..."
              placeholderTextColor={colors.textSecondary}
              style={{
                flex: 1,
                color: colors.text,
                fontSize: 14,
                fontWeight: "500",
              }}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Category Filter Pills ───────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 20,
          }}
        >
          {categories.map((cat) => {
            const isActive = selectedCat === cat;
            const catStyle = cat === "All" ? null : getCategory(cat);
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCat(cat)}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: isActive
                    ? catStyle
                      ? catStyle.bg
                      : "rgba(245,158,11,0.12)"
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                  borderWidth: 1,
                  borderColor: isActive
                    ? catStyle
                      ? catStyle.border
                      : "rgba(245,158,11,0.3)"
                    : "transparent",
                }}
              >
                {cat !== "All" && (
                  <Ionicons
                    name="pricetag"
                    size={11}
                    color={
                      isActive
                        ? catStyle?.text ?? "#f59e0b"
                        : colors.textSecondary
                    }
                  />
                )}
                {cat === "All" && (
                  <Ionicons
                    name="apps"
                    size={11}
                    color={isActive ? "#f59e0b" : colors.textSecondary}
                  />
                )}
                <Text
                  style={{
                    color: isActive
                      ? catStyle
                        ? catStyle.text
                        : "#f59e0b"
                      : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: isActive ? "800" : "600",
                    letterSpacing: 0.2,
                  }}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Content ─────────────────────────────────────── */}
        {isLoading ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                marginTop: 12,
                fontWeight: "500",
              }}
            >
              Brands load ho rahe hain...
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 60,
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 70,
                height: 70,
                borderRadius: 20,
                backgroundColor: "rgba(245,158,11,0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Ionicons name="bag-outline" size={32} color="#f59e0b" />
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: 16,
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 6,
              }}
            >
              {search ? "Koi brand nahi mila" : "Abhi koi brand nahi"}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 12,
                textAlign: "center",
                lineHeight: 18,
              }}
            >
              {search
                ? `"${search}" se koi brand match nahi hua`
                : "Admin panel se affiliate brands add karein"}
            </Text>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            {Object.entries(filteredGrouped).map(([category, categoryBrands]) => (
              <View key={category} style={{ marginBottom: 8 }}>
                <SectionHeader
                  category={category}
                  count={categoryBrands.length}
                  colors={colors}
                />
                {categoryBrands.map((brand) => (
                  <BrandCard
                    key={brand.id}
                    brand={brand}
                    colors={colors}
                    isDark={isDark}
                  />
                ))}
              </View>
            ))}
          </View>
        )}

        {/* ── Info banner ─────────────────────────────────── */}
        {!isLoading && filtered.length > 0 && (
          <View
            style={{
              marginHorizontal: 20,
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              backgroundColor: isDark
                ? "rgba(59,130,246,0.08)"
                : "rgba(59,130,246,0.05)",
              borderWidth: 1,
              borderColor: "rgba(59,130,246,0.15)",
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Ionicons
              name="information-circle"
              size={18}
              color="#3b82f6"
              style={{ marginTop: 1 }}
            />
            <Text
              style={{
                flex: 1,
                color: colors.textSecondary,
                fontSize: 11,
                lineHeight: 17,
              }}
            >
              "Order" button click karne se aap us brand ki website par chale
              jayenge aur directly order kar sakte hain.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeScreen>
  );
}
