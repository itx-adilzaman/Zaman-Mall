import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, FlatList, Dimensions, Animated, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import LottieImage from './LottieImage';
import { Product } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { BlurView } from 'expo-blur';

interface ProductCardImageSliderProps {
  product: Product;
  height: number;
}

const ProductCardImageSlider: React.FC<ProductCardImageSliderProps> = ({ product, height }) => {
  const images = useMemo(() => {
    const allImages = product.images?.length ? product.images : [product.image];
    return allImages.slice(0, 3); // Limit to 3 images as requested
  }, [product]);

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Auto-slide functionality
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % images.length;
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3500); // Slightly longer interval

    return () => clearInterval(interval);
  }, [activeIndex, images.length]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  if (images.length === 0) return null;

  return (
    <View 
      className="relative w-full" 
      style={{ height }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <FlatList
        ref={flatListRef}
        data={images}
        renderItem={({ item }) => (
          <View style={{ width: containerWidth, height }}>
            <LottieImage
              uri={item}
              style={{ width: containerWidth, height }}
              lottieSize={60}
              cachePolicy="memory-disk"
            />
          </View>
        )}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise(resolve => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: true });
          });
        }}
        keyExtractor={(_, index) => index.toString()}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots */}
      {images.length > 1 && (
        <View className="absolute bottom-2 left-0 right-0 flex-row justify-center items-center gap-1.5">
          {images.map((_, index) => {
            const width = scrollX.interpolate({
              inputRange: [
                containerWidth * (index - 1),
                containerWidth * index,
                containerWidth * (index + 1),
              ],
              outputRange: [6, 16, 6],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange: [
                containerWidth * (index - 1),
                containerWidth * index,
                containerWidth * (index + 1),
              ],
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    width,
                    opacity,
                    backgroundColor: '#FFFFFF',
                  },
                ]}
              />
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    height: 4,
    borderRadius: 2,
  },
});

export default ProductCardImageSlider;
