import React, { useEffect, useRef, useState } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
} from "react-native";
import { Image } from 'expo-image';
import LottieImage from './LottieImage';
import { useAds, Ad } from "@/hooks/useAds";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

const { width: WINDOW_WIDTH } = Dimensions.get("window");
const IMAGE_WIDTH = WINDOW_WIDTH - 48; // Actual image width with margin
const ASPECT_RATIO = 16 / 9;
const CAROUSEL_HEIGHT = IMAGE_WIDTH / ASPECT_RATIO;

const AdsCarouselSkeleton = () => {
  const { colors, isDark } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      animatedValue.setValue(0);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation());
    };

    startAnimation();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-WINDOW_WIDTH, WINDOW_WIDTH],
  });

  const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const shimmerColors: [string, string, string] = isDark 
    ? ['transparent', 'rgba(255, 255, 255, 0.08)', 'transparent']
    : ['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent'];

  return (
    <View 
      style={{ 
        width: IMAGE_WIDTH, 
        height: CAROUSEL_HEIGHT,
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
      }} 
      className="mx-6 mb-10 rounded-[32px] overflow-hidden border relative"
    >
      {/* Background/Base Skeleton Shimmer */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={shimmerColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Replicate the dark overlay and structural layout */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '70%',
          padding: 24,
          justifyContent: 'flex-end'
        }}
      >
        <View className="flex-row items-end justify-between">
          <View className="flex-1 mr-4">
            {/* Tag line */}
            <View className="flex-row items-center mb-3">
              <View style={{ backgroundColor: skeletonColor, width: 80, height: 10, borderRadius: 5 }} />
            </View>
            {/* Title lines */}
            <View style={{ backgroundColor: skeletonColor, width: '80%', height: 20, borderRadius: 10 }} className="mb-2" />
            <View style={{ backgroundColor: skeletonColor, width: '50%', height: 20, borderRadius: 10 }} />
          </View>
          
          {/* Action button */}
          <View style={{ backgroundColor: skeletonColor, width: 90, height: 38, borderRadius: 16 }} />
        </View>
      </LinearGradient>
    </View>
  );
};

export default function AdsCarousel() {
  const { colors, isDark } = useTheme();
  const adsQuery = useAds();
  const ads = adsQuery.data?.pages.flatMap(page => page.ads) || [];
  const isLoading = adsQuery.isLoading || adsQuery.isFetchingNextPage;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (!ads || ads.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % ads.length;
      scrollViewRef.current?.scrollTo({
        x: nextIndex * WINDOW_WIDTH,
        animated: true,
      });
      setActiveIndex(nextIndex);
      
      // Load more ads when reaching near the end
      if (nextIndex >= ads.length - 2 && adsQuery.hasNextPage && !adsQuery.isFetchingNextPage) {
        adsQuery.fetchNextPage();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [ads.length, activeIndex, adsQuery.hasNextPage, adsQuery.isFetchingNextPage]);

  if (isLoading) {
    return <AdsCarouselSkeleton />;
  }

  if (!ads || ads.length === 0) return null;

  return (
    <View className="mb-10">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / WINDOW_WIDTH);
          if (index !== activeIndex) setActiveIndex(index);
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={WINDOW_WIDTH}
      >
        {ads.map((ad: Ad, index) => (
          <View 
            key={ad.id} 
            style={{ width: WINDOW_WIDTH }} 
            className="items-center justify-center px-6"
          >
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => ad.link && router.push(ad.link as any)}
              style={{ 
                width: IMAGE_WIDTH, 
                height: CAROUSEL_HEIGHT,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 15 },
                shadowOpacity: isDark ? 0.8 : 0.3,
                shadowRadius: 25,
                elevation: 12,
                backgroundColor: colors.surface,
                borderColor: '#2563EB'
              }}
              className="rounded-[32px] overflow-hidden border"
            >
              <LottieImage
                uri={ad.image}
                style={{ width: IMAGE_WIDTH, height: CAROUSEL_HEIGHT }}
                lottieSize={70}
                cachePolicy="memory-disk"
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: '70%',
                  padding: 24,
                  justifyContent: 'flex-end'
                }}
              >
                <View className="flex-row items-end justify-between">
                  <View className="flex-1 mr-4">
                    <View className="flex-row items-center mb-2">
                      <View 
                        style={{ backgroundColor: colors.primary }}
                        className="w-2 h-2 rounded-full mr-2 shadow-sm shadow-primary" 
                      />
                      <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase tracking-[3px]">
                        EXCLUSIVE
                      </Text>
                    </View>
                    <Text className="text-white font-black text-2xl tracking-tight leading-7 italic" numberOfLines={2}>
                      {ad.title.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View className="bg-white px-5 py-2.5 rounded-2xl shadow-xl shadow-white/10">
                    <Text className="text-[#121212] font-black text-[10px] tracking-widest">DISCOVER</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* Luxury Indicators */}
      <View className="flex-row justify-center mt-6 gap-3">
        {ads.map((_, index) => (
          <TouchableOpacity 
            key={index}
            onPress={() => {
              scrollViewRef.current?.scrollTo({ x: index * WINDOW_WIDTH, animated: true });
              setActiveIndex(index);
            }}
          >
            <View
              style={{
                height: 3,
                width: index === activeIndex ? 30 : 12,
                borderRadius: 2,
                backgroundColor: index === activeIndex ? colors.primary : (isDark ? 'rgba(255,255,255,0.15)' : '#000000'),
              } as any}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
