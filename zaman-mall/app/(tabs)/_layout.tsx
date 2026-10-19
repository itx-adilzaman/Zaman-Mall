import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet, ActivityIndicator, View, Text, Animated, Dimensions, Platform } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);
const TAB_COUNT = 4;
const TAB_WIDTH = TAB_BAR_WIDTH / TAB_COUNT;

// Memoized Liquid Bubble to prevent unnecessary re-renders
const LiquidIndicator = ({ translateX, stretchX, isDark, colors }: any) => {
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: TAB_WIDTH - 12,
        height: 54,
        top: 7,
        left: 6,
        borderRadius: 27,
        backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
        transform: [
          { translateX },
          { scaleX: stretchX }
        ],
      }}
    />
  );
};

const TabsLayout = () => {
  const { user, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const stretchX = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const prevIndex = useRef(0);

  const cartCount = cart?.items?.length || 0;
  const wishlistCount = wishlist?.length || 0;

  useEffect(() => {
    const distance = Math.abs(activeIndex - prevIndex.current);
    
    // Position animation
    Animated.spring(translateX, {
      toValue: activeIndex * TAB_WIDTH,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
      mass: 0.6,
    }).start();

    // Stretch animation - only if moving
    if (distance > 0) {
      Animated.sequence([
        Animated.timing(stretchX, {
          toValue: 1 + (Math.min(distance, 2) * 0.15),
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(stretchX, {
          toValue: 1,
          friction: 8,
          useNativeDriver: true,
        })
      ]).start();
    }

    // Icon scale animation
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.25,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      })
    ]).start();

    prevIndex.current = activeIndex;
  }, [activeIndex]);

  const TabBarBackground = useCallback(() => (
    <View style={[StyleSheet.absoluteFill, { 
      borderRadius: 35, 
      overflow: 'hidden',
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    }]}>
      {/* Subtle border */}
      <View style={{
        ...StyleSheet.absoluteFillObject,
        borderRadius: 35,
        borderWidth: 1,
        borderColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)',
      }} />

      <LiquidIndicator 
        translateX={translateX} 
        stretchX={stretchX} 
        isDark={isDark} 
        colors={colors} 
      />
    </View>
  ), [isDark, colors, translateX, stretchX]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href={"/(auth)"} />;

  const Badge = ({ count }: { count: number }) => {
    if (count === 0) return null;
    return (
      <View 
        style={{ 
          position: 'absolute',
          right: -6,
          top: -3,
          backgroundColor: '#EF4444',
          borderRadius: 10,
          minWidth: 16,
          height: 16,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 4,
          borderWidth: 1.5,
          borderColor: isDark ? '#1F2937' : '#FFFFFF',
          zIndex: 1
        }}
      >
        <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>
          {count > 99 ? '99+' : count}
        </Text>
      </View>
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          marginHorizontal: TAB_BAR_MARGIN,
          bottom: insets.bottom > 0 ? insets.bottom : 15,
          borderRadius: 35,
          overflow: "hidden",
          elevation: 0,
        },
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "700",
          marginTop: 2,
        },
        headerShown: false,
      }}
      screenListeners={{
        state: (e) => {
          const state = e.data.state;
          if (state) {
            const index = state.index;
            // Hidden tabs (zeels) — index >= TAB_COUNT, don't move the indicator
            if (index >= TAB_COUNT) return;
            if (index !== activeIndex) {
              setActiveIndex(index);
              setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }, 10);
            }
          }
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Shop",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View style={focused ? { transform: [{ scale: scaleValue }] } : {}}>
              <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View style={focused ? { transform: [{ scale: scaleValue }] } : {}}>
              <Ionicons name={focused ? "heart" : "heart-outline"} size={24} color={color} />
              <Badge count={wishlistCount} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View style={focused ? { transform: [{ scale: scaleValue }] } : {}}>
              <Ionicons name={focused ? "cart" : "cart-outline"} size={24} color={color} />
              <Badge count={cartCount} />
            </Animated.View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View style={focused ? { transform: [{ scale: scaleValue }] } : {}}>
              <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
            </Animated.View>
          ),
        }}
      />
      {/* Affiliate Brands — hidden from tab bar, shown on home screen */}
      <Tabs.Screen
        name="affiliate"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      {/* Zeels — hidden from tab bar */}
      <Tabs.Screen
        name="zeels"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
