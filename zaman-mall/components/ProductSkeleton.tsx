import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/context/ThemeContext';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

interface ProductSkeletonProps {
  width?: number | string;
  style?: any;
}

const ProductSkeleton = ({ width: customWidth, style }: ProductSkeletonProps) => {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const bg   = isDark ? '#1E1E1E' : '#F0F0F0';
  const line = isDark ? '#2A2A2A' : '#E0E0E0';
  const shimmerColors: [string, string, string] = isDark
    ? ['transparent', 'rgba(255,255,255,0.06)', 'transparent']
    : ['transparent', 'rgba(255,255,255,0.55)', 'transparent'];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          width: customWidth || '100%',
        },
        style,
      ]}
    >
      {/* Image area with Lottie center */}
      <View style={[styles.imageArea, { backgroundColor: bg }]}>
        {/* Lottie loader centered */}
        <View style={styles.lottieWrap}>
          <LottieView
            source={require('../assets/58741126-92b7-45ad-97db-0ef14c9baa72.json')}
            autoPlay
            loop
            style={{ width: 56, height: 56 }}
          />
        </View>

        {/* Shimmer sweep */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={shimmerColors}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>

      {/* Info area */}
      <View style={styles.info}>
        {/* Category line */}
        <View style={[styles.lineShort, { backgroundColor: line, width: '38%' }]} />
        {/* Name line */}
        <View style={[styles.lineFull,  { backgroundColor: line, marginTop: 8 }]} />
        {/* Price + button */}
        <View style={styles.bottom}>
          <View style={[styles.lineShort, { backgroundColor: line, width: 70, height: 16 }]} />
          <View style={[styles.circle, { backgroundColor: line }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  imageArea: {
    width: '100%',
    height: 176,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lottieWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: 12,
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
  },
  lineFull: {
    width: '100%',
    height: 12,
    borderRadius: 6,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export default ProductSkeleton;
