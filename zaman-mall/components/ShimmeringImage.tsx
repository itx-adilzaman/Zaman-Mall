import React, { useState, useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet, Dimensions } from "react-native";
import { Image, ImageProps } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

const { width: WINDOW_WIDTH } = Dimensions.get("window");

interface ShimmeringImageProps extends ImageProps {
  shimmerStyle?: any;
}

export default function ShimmeringImage({
  style,
  shimmerStyle,
  onLoadEnd,
  onLoadStart,
  ...props
}: ShimmeringImageProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  // Shimmer sweep animation
  const sweepAnim = useRef(new Animated.Value(0)).current;
  // Fade in animation for image after load
  const fadeAnim = useRef(new Animated.Value(0)).current;
  // Pulse animation for background
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Shimmer sweep loop
  useEffect(() => {
    let sweepLoop: Animated.CompositeAnimation;

    if (loading) {
      // Sweep shimmer
      sweepAnim.setValue(0);
      sweepLoop = Animated.loop(
        Animated.timing(sweepAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      sweepLoop.start();

      // Pulse background
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    }

    return () => {
      sweepLoop?.stop();
    };
  }, [loading]);

  // Fade-in image when loaded
  const handleLoadEnd = (e: any) => {
    setLoading(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
    onLoadEnd?.(e);
  };

  const translateX = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-WINDOW_WIDTH * 1.5, WINDOW_WIDTH * 1.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  // Colors tuned for dark/light
  const bgColor = isDark ? "#1E1E1E" : "#E8E8E8";
  const shimmerColors: [string, string, string] = isDark
    ? ["transparent", "rgba(255,255,255,0.10)", "transparent"]
    : ["transparent", "rgba(255,255,255,0.65)", "transparent"];

  return (
    <View style={[style, styles.container]}>
      {/* Actual image — fades in after load */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: loading ? 0 : fadeAnim }]}>
        <Image
          style={StyleSheet.absoluteFill}
          onLoadStart={(e) => {
            setLoading(true);
            fadeAnim.setValue(0);
            onLoadStart?.(e);
          }}
          onLoadEnd={handleLoadEnd}
          {...props}
        />
      </Animated.View>

      {/* Shimmer overlay — hidden once loaded */}
      {loading && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: bgColor, opacity: pulseOpacity },
            shimmerStyle,
          ]}
        >
          {/* Moving shimmer stripe */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateX }, { skewX: "-15deg" }],
              },
            ]}
          >
            <LinearGradient
              colors={shimmerColors}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
