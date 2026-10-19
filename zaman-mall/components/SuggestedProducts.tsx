import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import LottieImage from './LottieImage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Product } from '@/types';

interface SuggestedProductsProps {
  products: Product[];
  currentCategory: string;
}

const SuggestedProducts: React.FC<SuggestedProductsProps> = ({ products, currentCategory }) => {
  const { colors, isDark } = useTheme();

  // Filter products by category and limit to 4
  const suggested = products
    .filter(p => p.category === currentCategory)
    .slice(0, 4);

  if (suggested.length === 0) return null;

  return (
    <View className="mt-8 px-6">
      <View className="flex-row justify-between items-center mb-6">
        <Text style={{ color: colors.text }} className="text-xl font-black italic tracking-tighter uppercase">
          Imperial <Text style={{ color: colors.primary }}>Curations</Text>
        </Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)')}>
          <Text style={{ color: colors.primary }} className="text-[10px] font-black uppercase tracking-widest">View All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {suggested.map((item) => (
          <TouchableOpacity
            key={item.id}
            onPress={() => router.push(`/product/${item.id}`)}
            className="mr-4 rounded-[32px] overflow-hidden border shadow-xl"
            style={{ 
              width: 160, 
              backgroundColor: colors.glassSurface, 
              borderColor: colors.glassBorder 
            }}
          >
            <LottieImage
              uri={item.images?.[0] || item.image}
              style={{ width: 160, height: 160 }}
              lottieSize={55}
            />
            <View className="p-4">
              <Text style={{ color: colors.text }} className="font-bold text-xs mb-1" numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: colors.primary }} className="font-black text-sm">
                Rs. {item.price.toLocaleString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default SuggestedProducts;
