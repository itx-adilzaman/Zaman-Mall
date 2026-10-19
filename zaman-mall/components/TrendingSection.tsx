import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { Product } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import ProductSkeleton from './ProductSkeleton';
import ProductCardImageSlider from './ProductCardImageSlider';

const { width } = Dimensions.get('window');

interface TrendingSectionProps {
  products: Product[];
  isLoading?: boolean;
}

const TrendingSection: React.FC<TrendingSectionProps> = ({ products, isLoading }) => {
  const { colors, isDark } = useTheme();

  // Shuffle products randomly on every render — different products each time
  const trendingProducts = useMemo(() => {
    if (!products.length) return [];
    return [...products]
      .sort(() => Math.random() - 0.5)
      .slice(0, 7);
  }, [products]);

  if (!isLoading && trendingProducts.length === 0) return null;

  return (
    <View className="mb-10 px-6">
      <View className="flex-row items-center justify-between mb-6">
        <View>
          <Text 
            style={{ color: colors.text }} 
            className="text-2xl font-black tracking-tight"
          >
            Trending Now
          </Text>
          <View className="flex-row items-center mt-1">
            <View className="w-8 h-1 bg-blue-500 rounded-full mr-2" />
            <Text 
              style={{ color: colors.textSecondary }} 
              className="text-[10px] font-bold uppercase tracking-widest"
            >
              Curated for you
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          className="flex-row items-center bg-blue-500/10 px-3 py-2 rounded-xl"
          activeOpacity={0.7}
        >
          <Text style={{ color: '#3b82f6' }} className="text-xs font-bold mr-1">View All</Text>
          <Ionicons name="arrow-forward" size={14} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        className="overflow-visible"
        snapToInterval={width * 0.7 + 16}
        decelerationRate="fast"
      >
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <ProductSkeleton key={i} width={width * 0.7} style={{ marginRight: 16 }} />
          ))
        ) : (
          trendingProducts.map((product, index) => {
            const imageUri = product.images?.[0] || product.image;
            return (
              <TouchableOpacity
                key={product.id}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${product.id}`)}
                style={{ 
                  width: width * 0.7,
                  height: 320,
                  marginRight: 16,
                  borderRadius: 32,
                  overflow: 'hidden',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                }}
              >
                {/* Image Section */}
                <View className="flex-1 relative">
                  <ProductCardImageSlider 
                    product={product} 
                    height={260} 
                  />
                  
                  {/* Floating Tags */}
                  <View className="absolute top-4 left-4 flex-row gap-2">
                    {product.country === 'china' && (
                      <View className="flex-row items-center bg-black/70 px-3 py-1.5 rounded-xl border border-red-500/30">
                        <Image 
                          source={require("@/assets/images/china.png")} 
                          style={{ width: 14, height: 10 }}
                          contentFit="contain"
                        />
                        <Text className="text-red-400 text-[9px] font-black ml-1.5 uppercase tracking-widest">China</Text>
                      </View>
                    )}
                    {product.country === 'pakistan' && (
                      <View className="flex-row items-center bg-black/70 px-3 py-1.5 rounded-xl border border-green-500/30">
                        <Image 
                          source={require("@/assets/images/pakistan.png")} 
                          style={{ width: 14, height: 10 }}
                          contentFit="contain"
                        />
                        <Text className="text-green-400 text-[9px] font-black ml-1.5 uppercase tracking-widest">Pakistan</Text>
                      </View>
                    )}
                  </View>

                  {/* Info Overlay */}
                  <View className="absolute bottom-4 left-4 right-4">
                    <Text 
                      className="text-white text-lg font-black mb-1" 
                      numberOfLines={1}
                    >
                      {product.name}
                    </Text>
                    
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-end">
                        <Text className="text-blue-400 text-xl font-black">
                          Rs. {product.price.toLocaleString()}
                        </Text>
                      </View>
                      
                      <View className="flex-row items-center bg-blue-500 px-3 py-1.5 rounded-full">
                        <Ionicons name="star" size={10} color="#fff" />
                        <Text className="text-white text-[10px] font-black ml-1">4.8</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Bottom Details Section */}
                <BlurView intensity={20} tint={isDark ? "dark" : "light"} className="px-5 py-4 flex-row items-center justify-between border-t border-white/10">
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <Ionicons name="cart-outline" size={16} color="#3b82f6" />
                    </View>
                    <Text style={{ color: colors.textSecondary }} className="text-[10px] font-bold">Fast Shipping</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                </BlurView>
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
  );
};

export default TrendingSection;
