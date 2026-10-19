import { useRef, useState, useEffect } from "react";
import { View, Text, Dimensions, ScrollView, TouchableOpacity, StatusBar, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "expo-router";
import PremiumButton from "@/components/PremiumButton";
import LottieImage from "@/components/LottieImage";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "@zaman_onboarding_seen";

const slides = [
  {
    key: "fast-delivery",
    title: "Lightning Fast Delivery",
    subtitle: "24/7 doorstep delivery with real-time tracking and premium packaging.",
    image: { uri: "https://res.cloudinary.com/dkdzuyjc4/image/upload/v1777978812/fast_delivery_zs7p8r.jpg" },
    accent: "#F97316",
  },
  {
    key: "secure-payment",
    title: "Secure Payments",
    subtitle: "Bank-level encryption, verified partners and safe checkout every time.",
    image: { uri: "https://res.cloudinary.com/dkdzuyjc4/image/upload/v1777978872/secure_payment_lododl.jpg" },
    accent: "#2563EB",
  },
  {
    key: "premium-experience",
    title: "Premium Shopping Experience",
    subtitle: "Curated products, smart recommendations and a smooth, ad-free interface.",
    image: { uri: "https://res.cloudinary.com/dkdzuyjc4/image/upload/v1777978797/premium_shopping_experience_dl26v3.jpg" },
    accent: "#EC4899",
  },
  {
    key: "zaman-brand",
    title: "Welcome to Zaman Mall",
    subtitle: "Your personal super mall in your pocket. Shop smarter, faster and better.",
    image: require("@/assets/images/zaman-logo1.png"),
    accent: "#1DB954",
  },
];

// ImageShimmer replaced by LottieImage component

export default function OnboardingScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [buttonScale] = useState(new Animated.Value(1));

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = async () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
      setCurrentIndex(nextIndex);
      return;
    }

    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {}

    router.replace("/(auth)/register");
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (e) {}

    router.replace("/(auth)/register");
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const activeSlide = slides[currentIndex] ?? slides[0];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <LinearGradient
        colors={
          isDark
            ? ["#020617", "#020617", activeSlide.accent + "33"]
            : ["#ecfdf3", "#f5f5f5", activeSlide.accent + "1A"]
        }
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, paddingTop: 40, paddingBottom: 32 }}>
          <View
            style={{
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 10,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                Zaman Mall
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: "800",
                  letterSpacing: -0.5,
                  marginTop: 4,
                }}
              >
                Experience Zaman Mall
              </Text>
            </View>
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.8}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                Skip
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            removeClippedSubviews
            onMomentumScrollEnd={handleMomentumScrollEnd}
            style={{ marginTop: 32 }}
          >
            {slides.map((slide, index) => (
              <View key={slide.key} style={{ width }}>
                <View
                  style={{
                    flex: 1,
                    paddingHorizontal: 24,
                    paddingTop: 12,
                    paddingBottom: 24,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      borderRadius: 32,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                      backgroundColor: colors.glassSurface,
                    }}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? [slide.accent + "2E", "#020617"]
                          : ["#FFFFFF", slide.accent + "14"]
                      }
                      style={{ flex: 1 }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 20,
                          paddingTop: 24,
                          paddingBottom: 16,
                          flex: 1,
                          justifyContent: "space-between",
                        }}
                      >
                        <View>
                          <View
                            style={{
                              alignSelf: "flex-start",
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 999,
                              backgroundColor: slide.accent + "1A",
                              marginBottom: 16,
                            }}
                          >
                            <Text
                              style={{
                                color: slide.accent,
                                fontSize: 10,
                                fontWeight: "700",
                                letterSpacing: 2,
                                textTransform: "uppercase",
                              }}
                            >
                              Step {index + 1} of {slides.length}
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: colors.text,
                              fontSize: 24,
                              fontWeight: "800",
                              letterSpacing: -0.5,
                            }}
                          >
                            {slide.title}
                          </Text>
                          <Text
                            style={{
                              color: colors.textSecondary,
                              fontSize: 13,
                              marginTop: 10,
                              lineHeight: 20,
                            }}
                          >
                            {slide.subtitle}
                          </Text>
                        </View>

                        <View
                          style={{
                            alignItems: "center",
                            justifyContent: "center",
                            marginTop: 12,
                          }}
                        >
                          <View
                            style={{
                              width: width * 0.84,
                              height: width * 0.84,
                              borderRadius: 32,
                              overflow: "hidden",
                              backgroundColor: colors.glassSurface,
                              borderWidth: 1,
                              borderColor: colors.glassBorder,
                            }}
                          >
                            <LottieImage
                              source={slide.image}
                              style={{ width: "100%", height: "100%" }}
                              lottieSize={90}
                            />
                          </View>
                        </View>
                      </View>
                    </LinearGradient>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 24,
              marginTop: 8,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              {slides.map((slide, index) => {
                const isActive = index === currentIndex;
                return (
                  <View
                    key={slide.key}
                    style={{
                      width: isActive ? 22 : 8,
                      height: 8,
                      borderRadius: 999,
                      marginHorizontal: 4,
                      backgroundColor: isActive
                        ? activeSlide.accent
                        : colors.border,
                    }}
                  />
                );
              })}
            </View>

            <Animated.View
              style={{
                transform: [{ scale: buttonScale }],
              }}
            >
              <PremiumButton
                title={currentIndex === slides.length - 1 ? "Start Shopping" : "Next"}
                colors={[activeSlide.accent, colors.primary] as [string, string]}
                onPress={handleNext}
              />
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

