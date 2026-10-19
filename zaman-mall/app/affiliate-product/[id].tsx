/**
 * Affiliate Product Detail Page — Professional Redesign
 * Route: /affiliate-product/[id]
 */
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Dimensions,
  Share,
  StatusBar,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/context/ThemeContext";
import useAffiliateProducts from "@/hooks/useAffiliateProducts";
import useAffiliateBrands from "@/hooks/useAffiliateBrands";

const { width: SW, height: SH } = Dimensions.get("window");
const HERO_H = SH * 0.48;

// Brand accent — matches app primary
const PRIMARY = "#1DB954";

// ── open link helper ──────────────────────────────────────────────────────────
const openLink = async (url: string, name: string) => {
  try {
    const ok = await Linking.canOpenURL(url);
    if (ok) await Linking.openURL(url);
    else Alert.alert("Link Error", `${name} ka link nahi khul saka.`);
  } catch {
    Alert.alert("Error", "Link open karne mein masla hua.");
  }
};

const fmtPrice = (price: number) =>
  price > 0 ? `Rs. ${price.toLocaleString()}` : null;

// ── Loading Screen ────────────────────────────────────────────────────────────
function LoadingScreen({ colors }: { colors: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={PRIMARY} />
      <Text style={{ color: colors.textSecondary, marginTop: 14, fontWeight: "600", fontSize: 13 }}>
        Loading product...
      </Text>
    </View>
  );
}

// ── Not Found Screen ──────────────────────────────────────────────────────────
function NotFoundScreen({ colors }: { colors: any }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center", padding: 32 }}>
      <View style={{
        width: 80, height: 80, borderRadius: 24,
        backgroundColor: `${PRIMARY}15`,
        alignItems: "center", justifyContent: "center",
        marginBottom: 20,
        borderWidth: 1, borderColor: `${PRIMARY}30`,
      }}>
        <Ionicons name="alert-circle-outline" size={40} color={PRIMARY} />
      </View>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900", marginBottom: 8, letterSpacing: -0.5 }}>
        Product Not Found
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: "center", marginBottom: 28, lineHeight: 20 }}>
        Ye product abhi available nahi hai ya remove kar diya gaya hai.
      </Text>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{
          backgroundColor: PRIMARY,
          paddingHorizontal: 28, paddingVertical: 13,
          borderRadius: 16,
          shadowColor: PRIMARY,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        <Text style={{ color: "#121212", fontWeight: "900", fontSize: 14 }}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Animated Dot Indicator ────────────────────────────────────────────────────
const DotIndicator = ({
  total, active,
}: { total: number; active: number }) => {
  if (total <= 1) return null;
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, paddingVertical: 10 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            height: 6,
            width: i === active ? 22 : 6,
            borderRadius: 3,
            backgroundColor: i === active ? PRIMARY : "rgba(128,128,128,0.35)",
          }}
        />
      ))}
    </View>
  );
};

// ── Section Header ────────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, colors }: { icon: any; title: string; colors: any }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
    <View style={{
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: `${PRIMARY}15`,
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: `${PRIMARY}25`,
    }}>
      <Ionicons name={icon} size={16} color={PRIMARY} />
    </View>
    <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900", letterSpacing: -0.3 }}>
      {title}
    </Text>
  </View>
);

// ── Detail Row ────────────────────────────────────────────────────────────────
const DetailRow = ({
  icon, label, value, colors, valueColor, last = false,
}: {
  icon: any; label: string; value: string; colors: any; valueColor?: string; last?: boolean;
}) => (
  <View style={{
    flexDirection: "row", alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: last ? 0 : 1,
    borderBottomColor: colors.border,
  }}>
    <View style={{
      width: 32, height: 32, borderRadius: 9,
      backgroundColor: `${PRIMARY}12`,
      alignItems: "center", justifyContent: "center",
      marginRight: 12,
    }}>
      <Ionicons name={icon} size={15} color={PRIMARY} />
    </View>
    <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: "600", flex: 1 }}>
      {label}
    </Text>
    <Text style={{
      color: valueColor ?? colors.text,
      fontSize: 13, fontWeight: "800",
      flexShrink: 1, textAlign: "right",
    }}>
      {value}
    </Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function AffiliateProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { products, isLoading } = useAffiliateProducts();
  const { brands } = useAffiliateBrands();

  const [activeImg, setActiveImg] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatRef = useRef<FlatList>(null);

  const product = products.find((p) => p.id === id);
  const brand = product?.brand_id ? brands.find((b) => b.id === product.brand_id) : null;

  const images: string[] = useMemo(() => {
    if (!product) return [];
    return [
      product.image_url,
      ...(Array.isArray(product.images)
        ? product.images.filter((img: string) => img && img !== product.image_url)
        : []),
    ].filter(Boolean);
  }, [product]);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const idx = Math.round(e.nativeEvent.contentOffset.x / SW);
      setActiveImg(idx);
    },
    []
  );

  const handleShare = useCallback(async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `${product.name}\n\n${product.description ?? ""}\n\nOrder karein: ${product.affiliate_url}`.trim(),
        url: product.affiliate_url,
      });
    } catch {}
  }, [product]);

  if (isLoading) return <LoadingScreen colors={colors} />;
  if (!product) return <NotFoundScreen colors={colors} />;

  const priceText = fmtPrice(product.price);
  const cardBg = isDark ? "#161616" : "#FFFFFF";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 130 }}
        bounces
      >
        {/* ── HERO IMAGE SLIDER ──────────────────────────────────────────── */}
        <View style={{ height: HERO_H, backgroundColor: "#000", position: "relative" }}>
          <Animated.FlatList
            ref={flatRef}
            data={images}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false, listener: handleScroll }
            )}
            scrollEventThrottle={16}
            renderItem={({ item }) => (
              <ExpoImage
                source={{ uri: item }}
                style={{ width: SW, height: HERO_H }}
                contentFit="cover"
                transition={300}
              />
            )}
          />

          {/* Bottom gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.85)"]}
            style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: HERO_H * 0.55 }}
          />

          {/* Top gradient for header legibility */}
          <LinearGradient
            colors={["rgba(0,0,0,0.5)", "transparent"]}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 110 }}
          />

          {/* Header: back + share */}
          <View style={{
            position: "absolute",
            top: insets.top + 8,
            left: 0, right: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
          }}>
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.8}
              style={{
                width: 42, height: 42, borderRadius: 14,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <Ionicons name="arrow-back" size={21} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={{
                width: 42, height: 42, borderRadius: 14,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <Ionicons name="share-outline" size={21} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Image counter */}
          {images.length > 1 && (
            <View style={{
              position: "absolute", top: insets.top + 14,
              alignSelf: "center", left: 0, right: 0, alignItems: "center",
            }}>
              <View style={{
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingHorizontal: 12, paddingVertical: 5,
                borderRadius: 999,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.18)",
              }}>
                <Text style={{ color: "#fff", fontSize: 11, fontWeight: "800" }}>
                  {activeImg + 1} / {images.length}
                </Text>
              </View>
            </View>
          )}

          {/* Hero bottom: name + badges */}
          <View style={{
            position: "absolute", bottom: 16, left: 16, right: 16,
          }}>
            {/* Badges */}
            <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {product.is_featured && (
                <View style={{
                  flexDirection: "row", alignItems: "center", gap: 5,
                  backgroundColor: "rgba(245,158,11,0.95)",
                  paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                }}>
                  <Ionicons name="star" size={10} color="#000" />
                  <Text style={{ color: "#000", fontSize: 10, fontWeight: "900" }}>Top Pick</Text>
                </View>
              )}
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                backgroundColor: `${PRIMARY}CC`,
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
              }}>
                <Ionicons name="pricetag" size={10} color="#121212" />
                <Text style={{ color: "#121212", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {product.category}
                </Text>
              </View>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                backgroundColor: "rgba(255,255,255,0.15)",
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
              }}>
                <Ionicons name="link-outline" size={10} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>Affiliate</Text>
              </View>
            </View>

            {/* Product name on hero */}
            <Text style={{
              color: "#fff", fontSize: 24, fontWeight: "900",
              letterSpacing: -0.5, lineHeight: 29,
              textShadowColor: "rgba(0,0,0,0.5)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 4,
            }} numberOfLines={2}>
              {product.name}
            </Text>
          </View>
        </View>

        {/* ── DOT INDICATOR ─────────────────────────────────────────────── */}
        <DotIndicator total={images.length} active={activeImg} />

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, paddingTop: images.length > 1 ? 0 : 12 }}>

          {/* ── PRICE + QUICK ACTION ROW ──────────────────────────────── */}
          <View style={{
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: cardBg,
            borderRadius: 20,
            padding: 18,
            marginBottom: 14,
            borderWidth: 1, borderColor: cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.8 }}>
                Affiliate Price
              </Text>
              {priceText ? (
                <Text style={{ color: PRIMARY, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 }}>
                  {priceText}
                </Text>
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 16, fontWeight: "700" }}>
                  Price on request
                </Text>
              )}
            </View>

            {/* Share mini-button */}
            <TouchableOpacity
              onPress={handleShare}
              activeOpacity={0.8}
              style={{
                width: 46, height: 46, borderRadius: 14,
                backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: cardBorder,
              }}
            >
              <Ionicons name="share-social-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* ── BRAND CARD ────────────────────────────────────────────── */}
          {(brand || product.brand_name) && (
            <TouchableOpacity
              activeOpacity={brand?.affiliate_url ? 0.78 : 1}
              onPress={() => brand?.affiliate_url ? openLink(brand.affiliate_url, brand.name) : undefined}
              style={{
                flexDirection: "row", alignItems: "center", gap: 14,
                backgroundColor: cardBg,
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1, borderColor: cardBorder,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.25 : 0.06,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              {/* Brand logo */}
              {brand?.logo_url ? (
                <View style={{
                  width: 60, height: 60, borderRadius: 16,
                  backgroundColor: "#fff",
                  alignItems: "center", justifyContent: "center",
                  padding: 6,
                  borderWidth: 1, borderColor: "rgba(0,0,0,0.07)",
                  shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
                }}>
                  <ExpoImage
                    source={{ uri: brand.logo_url }}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
                    contentFit="contain"
                  />
                </View>
              ) : (
                <View style={{
                  width: 60, height: 60, borderRadius: 16,
                  backgroundColor: `${PRIMARY}15`,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: `${PRIMARY}30`,
                }}>
                  <Ionicons name="bag" size={26} color={PRIMARY} />
                </View>
              )}

              {/* Brand text */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: "900" }}>
                    {brand?.name ?? product.brand_name}
                  </Text>
                  {brand?.affiliate_url && (
                    <View style={{
                      backgroundColor: `${PRIMARY}20`,
                      paddingHorizontal: 6, paddingVertical: 2,
                      borderRadius: 6,
                    }}>
                      <Text style={{ color: PRIMARY, fontSize: 9, fontWeight: "900" }}>PARTNER</Text>
                    </View>
                  )}
                </View>
                {brand?.name_urdu ? (
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginBottom: 2 }}>
                    {brand.name_urdu}
                  </Text>
                ) : null}
                <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
                  {brand?.description ?? "Official Brand Partner"}
                </Text>
              </View>

              {brand?.affiliate_url && (
                <View style={{
                  width: 34, height: 34, borderRadius: 11,
                  backgroundColor: `${PRIMARY}15`,
                  alignItems: "center", justifyContent: "center",
                  borderWidth: 1, borderColor: `${PRIMARY}25`,
                }}>
                  <Ionicons name="open-outline" size={16} color={PRIMARY} />
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* ── DESCRIPTION ───────────────────────────────────────────── */}
          {product.description ? (
            <View style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1, borderColor: cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.06,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <SectionHeader icon="document-text" title="Description" colors={colors} />
              <Text style={{
                color: colors.textSecondary, fontSize: 13.5,
                lineHeight: 22, letterSpacing: 0.1,
              }}>
                {product.description}
              </Text>
            </View>
          ) : null}

          {/* ── PRODUCT DETAILS CARD ──────────────────────────────────── */}
          <View style={{
            backgroundColor: cardBg,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 4,
            marginBottom: 14,
            borderWidth: 1, borderColor: cardBorder,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.25 : 0.06,
            shadowRadius: 12,
            elevation: 4,
          }}>
            <SectionHeader icon="information-circle" title="Product Details" colors={colors} />

            <DetailRow
              icon="pricetag-outline"
              label="Category"
              value={product.category}
              colors={colors}
              valueColor={PRIMARY}
            />
            {(brand?.name || product.brand_name) ? (
              <DetailRow
                icon="bag-outline"
                label="Brand"
                value={brand?.name ?? product.brand_name ?? ""}
                colors={colors}
              />
            ) : null}
            {priceText ? (
              <DetailRow
                icon="cash-outline"
                label="Price"
                value={priceText}
                colors={colors}
                valueColor={PRIMARY}
              />
            ) : null}
            <DetailRow
              icon="storefront-outline"
              label="Type"
              value="Affiliate Product"
              colors={colors}
            />
            {product.is_featured ? (
              <DetailRow
                icon="star-outline"
                label="Status"
                value="⭐ Top Pick"
                colors={colors}
                valueColor="#F59E0B"
                last
              />
            ) : (
              <View style={{ paddingBottom: 8 }} />
            )}
          </View>

          {/* ── GALLERY ───────────────────────────────────────────────── */}
          {images.length > 1 && (
            <View style={{
              backgroundColor: cardBg,
              borderRadius: 20,
              padding: 18,
              marginBottom: 14,
              borderWidth: 1, borderColor: cardBorder,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.06,
              shadowRadius: 12,
              elevation: 4,
            }}>
              <SectionHeader icon="images" title={`Gallery  (${images.length})`} colors={colors} />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {images.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    onPress={() => {
                      flatRef.current?.scrollToIndex({ index: idx, animated: true });
                      setActiveImg(idx);
                    }}
                    style={{
                      borderRadius: 14,
                      overflow: "hidden",
                      borderWidth: 2.5,
                      borderColor: idx === activeImg ? PRIMARY : "transparent",
                      shadowColor: idx === activeImg ? PRIMARY : "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: idx === activeImg ? 0.4 : 0,
                      shadowRadius: 6,
                      elevation: idx === activeImg ? 4 : 0,
                    }}
                  >
                    <ExpoImage
                      source={{ uri: img }}
                      style={{ width: 76, height: 76 }}
                      contentFit="cover"
                      transition={200}
                    />
                    {idx === activeImg && (
                      <View style={{
                        position: "absolute", inset: 0,
                        backgroundColor: `${PRIMARY}20`,
                      }} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── VISIT BRAND BUTTON ────────────────────────────────────── */}
          {brand?.affiliate_url && (
            <TouchableOpacity
              onPress={() => openLink(brand.affiliate_url, brand.name)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row", alignItems: "center",
                justifyContent: "center", gap: 10,
                backgroundColor: cardBg,
                paddingVertical: 15,
                borderRadius: 18,
                marginBottom: 8,
                borderWidth: 1, borderColor: cardBorder,
              }}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 8,
                backgroundColor: `${PRIMARY}15`,
                alignItems: "center", justifyContent: "center",
              }}>
                <Ionicons name="storefront-outline" size={15} color={PRIMARY} />
              </View>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: "800" }}>
                Visit {brand.name} Website
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* ── STICKY BOTTOM BAR ─────────────────────────────────────────────── */}
      <View style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        backgroundColor: isDark ? "#111111" : "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)",
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: insets.bottom + 14,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDark ? 0.35 : 0.08,
        shadowRadius: 12,
        elevation: 16,
      }}>
        {/* Price row above button */}
        {priceText && (
          <View style={{
            flexDirection: "row", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}>
            <View>
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600", marginBottom: 1 }}>
                Affiliate Price
              </Text>
              <Text style={{ color: PRIMARY, fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                {priceText}
              </Text>
            </View>

            {product.is_featured && (
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 5,
                backgroundColor: "rgba(245,158,11,0.12)",
                paddingHorizontal: 10, paddingVertical: 6,
                borderRadius: 10,
                borderWidth: 1, borderColor: "rgba(245,158,11,0.25)",
              }}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "900" }}>Top Pick</Text>
              </View>
            )}
          </View>
        )}

        {/* Order Now CTA */}
        <TouchableOpacity
          onPress={() => openLink(product.affiliate_url, product.name)}
          activeOpacity={0.85}
          style={{
            backgroundColor: PRIMARY,
            paddingVertical: 16,
            borderRadius: 18,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            shadowColor: PRIMARY,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.45,
            shadowRadius: 14,
            elevation: 8,
          }}
        >
          <Ionicons name="cart" size={22} color="#121212" />
          <Text style={{ color: "#121212", fontSize: 16, fontWeight: "900", letterSpacing: 0.3 }}>
            Order Now
          </Text>
          <View style={{
            backgroundColor: "rgba(0,0,0,0.12)",
            width: 28, height: 28, borderRadius: 8,
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="open-outline" size={15} color="#121212" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
