/**
 * AffiliateProductsGrid — Home Screen Preview Row
 *
 * Shows a horizontal scrollable row of affiliate product cards.
 * "View All" button navigates to /affiliate-products full screen.
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateProducts from "@/hooks/useAffiliateProducts";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W  = SCREEN_W * 0.44;
const IMG_H   = CARD_W * 0.92;
const ACCENT  = "#6366f1";
const PREVIEW = 8;

const fmtPrice = (price: number) =>
  price > 0 ? `Rs. ${price.toLocaleString()}` : null;

// ── Mini product card ─────────────────────────────────────────────────────────
const MiniCard = ({
  product,
  colors,
  isDark,
}: {
  product: ReturnType<typeof useAffiliateProducts>["products"][0];
  colors: any;
  isDark: boolean;
}) => (
  <TouchableOpacity
    activeOpacity={0.88}
    onPress={() => router.push(`/affiliate-product/${product.id}`)}
    style={{
      width: CARD_W,
      backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
      borderRadius: 20,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.07)",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: isDark ? 0.32 : 0.09,
      shadowRadius: 14,
      elevation: 4,
    }}
  >
    {/* ── Image ── */}
    <View style={{ position: "relative" }}>
      <ExpoImage
        source={{ uri: product.image_url }}
        style={{ width: "100%", height: IMG_H }}
        contentFit="cover"
        transition={250}
      />

      {/* Featured badge */}
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

      {/* Brand badge */}
      {product.brand_name ? (
        <View style={{
          position: "absolute", bottom: 8, right: 8,
          backgroundColor: "rgba(0,0,0,0.70)",
          paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
          borderWidth: 1, borderColor: "rgba(255,255,255,0.12)",
        }}>
          <Text style={{ color: "rgba(255,255,255,0.95)", fontSize: 9, fontWeight: "800" }}>
            {product.brand_name}
          </Text>
        </View>
      ) : null}
    </View>

    {/* ── Content ── */}
    <View style={{ padding: 11, gap: 5 }}>
      {/* Product name */}
      <Text
        style={{ color: colors.text, fontSize: 12, fontWeight: "700", lineHeight: 16 }}
        numberOfLines={2}
      >
        {product.name}
      </Text>

      {/* Price */}
      {fmtPrice(product.price) ? (
        <Text style={{ color: ACCENT, fontSize: 14, fontWeight: "900", letterSpacing: -0.3 }}>
          {fmtPrice(product.price)}
        </Text>
      ) : (
        <Text style={{ color: colors.textSecondary, fontSize: 11, fontStyle: "italic" }}>
          Price on request
        </Text>
      )}

      {/* Open Details button */}
      <TouchableOpacity
        onPress={(e) => {
          e.stopPropagation();
          router.push(`/affiliate-product/${product.id}`);
        }}
        activeOpacity={0.82}
        style={{
          marginTop: 3,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          paddingVertical: 9,
          borderRadius: 13,
          backgroundColor: ACCENT,
          shadowColor: ACCENT,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.32,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Ionicons name="eye-outline" size={13} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.2 }}>
          Open Details
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

// ── Main component ────────────────────────────────────────────────────────────
export default function AffiliateProductsGrid() {
  const { colors, isDark } = useTheme();
  const { products, isLoading } = useAffiliateProducts();

  // Don't render section if no products and not loading
  if (!isLoading && products.length === 0) return null;

  const preview = products.slice(0, PREVIEW);

  return (
    <View style={{ marginBottom: 24 }}>

      {/* ── Section Header ─────────────────────────────── */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        marginBottom: 14,
      }}>
        {/* Left: icon + title */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={{
            width: 34, height: 34, borderRadius: 11,
            backgroundColor: "rgba(99,102,241,0.12)",
            borderWidth: 1, borderColor: "rgba(99,102,241,0.28)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="storefront" size={17} color={ACCENT} />
          </View>
          <View>
            <Text style={{
              color: colors.text, fontSize: 16,
              fontWeight: "800", letterSpacing: -0.3,
            }}>
              Affiliate Products
            </Text>
            <Text style={{
              color: ACCENT, fontSize: 10,
              fontWeight: "700", textTransform: "uppercase", letterSpacing: 1,
            }}>
              Top Picks
            </Text>
          </View>
        </View>

        {/* Right: View All */}
        <TouchableOpacity
          onPress={() => router.push("/affiliate-products")}
          activeOpacity={0.7}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: "rgba(99,102,241,0.10)",
            paddingHorizontal: 10, paddingVertical: 6,
            borderRadius: 20,
            borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
          }}
        >
          <Text style={{ color: ACCENT, fontSize: 11, fontWeight: "700" }}>
            View All
          </Text>
          <Ionicons name="chevron-forward" size={12} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* ── Product Row ─────────────────────────────────── */}
      {isLoading ? (
        // Skeleton placeholders
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          scrollEnabled={false}
        >
          {[1, 2, 3].map((i) => (
            <View key={i} style={{
              width: CARD_W,
              height: CARD_W * 1.55,
              borderRadius: 18,
              backgroundColor: isDark ? "#1E1E1E" : "#EFEFEF",
            }} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          decelerationRate="fast"
          snapToInterval={CARD_W + 12}
          snapToAlignment="start"
        >
          {preview.map((product) => (
            <MiniCard
              key={product.id}
              product={product}
              colors={colors}
              isDark={isDark}
            />
          ))}

          {/* "See More" card at the end if there are more than PREVIEW */}
          {products.length > PREVIEW && (
            <TouchableOpacity
              onPress={() => router.push("/affiliate-products")}
              activeOpacity={0.8}
              style={{
                width: CARD_W * 0.55,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 18,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: isDark ? "rgba(99,102,241,0.35)" : "rgba(99,102,241,0.3)",
                backgroundColor: "rgba(99,102,241,0.05)",
                gap: 8,
                paddingVertical: 24,
              }}
            >
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: "rgba(99,102,241,0.12)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
              }}>
                <Ionicons name="grid" size={20} color={ACCENT} />
              </View>
              <Text style={{ color: ACCENT, fontSize: 12, fontWeight: "800", textAlign: "center" }}>
                +{products.length - PREVIEW}{"\n"}More
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
