/**
 * AffiliateBrandsGrid — Home Screen Preview Row
 *
 * - Transparent background (no white box) — PNG friendly
 * - Large logos so they are clearly visible
 * - "View All" card with same height as brand cards
 * - "View All" button in header
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateBrands from "@/hooks/useAffiliateBrands";

const { width: SCREEN_W } = Dimensions.get("window");

// Card dimensions — bigger card, bigger logo
const CARD_W  = SCREEN_W * 0.40;   // 40% of screen width
const LOGO_S  = CARD_W * 0.75;     // logo = 75% of card width → very visible
const CARD_H  = LOGO_S + 52;       // logo + name = consistent height

const AMBER = "#f59e0b";

const openLink = async (url: string) => {
  try {
    await Linking.openURL(url);
  } catch {
    // silently ignore — link open na ho sake toh koi error nahi dikhana
  }
};

export default function AffiliateBrandsGrid() {
  const { colors, isDark } = useTheme();
  const { brands, isLoading } = useAffiliateBrands();

  if (!isLoading && brands.length === 0) return null;

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
            width: 36, height: 36, borderRadius: 12,
            backgroundColor: "rgba(245,158,11,0.12)",
            borderWidth: 1, borderColor: "rgba(245,158,11,0.28)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="bag" size={18} color={AMBER} />
          </View>
          <View>
            <Text style={{
              color: colors.text,
              fontSize: 16, fontWeight: "800", letterSpacing: -0.3,
            }}>
              Top Brands
            </Text>
            <Text style={{
              color: AMBER,
              fontSize: 10, fontWeight: "700",
              textTransform: "uppercase", letterSpacing: 1,
            }}>
              Affiliate Partners
            </Text>
          </View>
        </View>

        {/* Right: View All button */}
        <TouchableOpacity
          onPress={() => router.push("/affiliate-brands")}
          activeOpacity={0.72}
          style={{
            flexDirection: "row", alignItems: "center", gap: 4,
            backgroundColor: "rgba(245,158,11,0.10)",
            paddingHorizontal: 12, paddingVertical: 7,
            borderRadius: 20,
            borderWidth: 1, borderColor: "rgba(245,158,11,0.30)",
          }}
        >
          <Text style={{ color: AMBER, fontSize: 12, fontWeight: "800" }}>
            View All
          </Text>
          <Ionicons name="chevron-forward" size={13} color={AMBER} />
        </TouchableOpacity>
      </View>

      {/* ── Horizontal scroll ───────────────────────────── */}
      {isLoading ? (
        // Skeleton row
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
          scrollEnabled={false}
        >
          {[1, 2, 3].map(i => (
            <View key={i} style={{
              width: CARD_W,
              height: CARD_H,
              borderRadius: 22,
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
          {brands.map((brand) => (
            <TouchableOpacity
              key={brand.id}
              onPress={() => openLink(brand.affiliate_url)}
              activeOpacity={0.82}
              style={{
                width: CARD_W,
                height: CARD_H,
                alignItems: "center",
                justifyContent: "center",
                // Transparent — no white box, PNG logos show naturally
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.025)",
                borderRadius: 22,
                paddingTop: 14,
                paddingBottom: 14,
                paddingHorizontal: 10,
                borderWidth: 1,
                borderColor: isDark
                  ? "rgba(255,255,255,0.07)"
                  : "rgba(0,0,0,0.05)",
              }}
            >
              {/* Logo — large, no container box, transparent bg */}
              <ExpoImage
                source={{ uri: brand.logo_url }}
                style={{
                  width: LOGO_S,
                  height: LOGO_S,
                }}
                contentFit="contain"
                transition={200}
              />

              {/* Name */}
              <Text
                style={{
                  color: colors.text,
                  fontSize: 15, fontWeight: "800",
                  textAlign: "center",
                  letterSpacing: -0.3,
                  marginTop: 8,
                  paddingHorizontal: 4,
                }}
                numberOfLines={1}
              >
                {brand.name}
              </Text>
            </TouchableOpacity>
          ))}

          {/* "View All" end card — same height as brand cards */}
          {brands.length > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/affiliate-brands")}
              activeOpacity={0.8}
              style={{
                width: CARD_W * 0.58,
                height: CARD_H,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 22,
                borderWidth: 1.5,
                borderStyle: "dashed",
                borderColor: isDark
                  ? "rgba(245,158,11,0.28)"
                  : "rgba(245,158,11,0.25)",
                backgroundColor: "rgba(245,158,11,0.04)",
                gap: 10,
              }}
            >
              <View style={{
                width: 46, height: 46, borderRadius: 23,
                backgroundColor: "rgba(245,158,11,0.12)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
              }}>
                <Ionicons name="grid" size={20} color={AMBER} />
              </View>
              <Text style={{
                color: AMBER,
                fontSize: 12, fontWeight: "800",
                textAlign: "center",
                lineHeight: 18,
              }}>
                {"View\nAll"}
              </Text>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 3,
                backgroundColor: "rgba(245,158,11,0.12)",
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: 999,
              }}>
                <Text style={{ color: AMBER, fontSize: 10, fontWeight: "700" }}>
                  {brands.length}
                </Text>
                <Text style={{ color: AMBER, fontSize: 10 }}>brands</Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
