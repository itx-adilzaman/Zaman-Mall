import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  StyleSheet,
} from "react-native";
import LottieImage from "./LottieImage";

import ProductSkeleton from "./ProductSkeleton";

interface ProductsGridProps {
  isLoading: boolean;
  isError: boolean;
  products: Product[];
}

// ─── Product image with Lottie placeholder ────────────────────────────────────
// Now handled by shared LottieImage component

export const renderProduct = (product: Product, colors: any, isDark: boolean, toggleWishlist: any, isInWishlist: any, isAddingToWishlist: any, isRemovingFromWishlist: any, handleShareProduct: any) => {
  // Calculate original price (200 Rs more) and discount
  const originalPrice = (product.price || 0) + 200;
  const discount = Math.round(((originalPrice - (product.price || 0)) / originalPrice) * 100);
  
  // Use real stock from product data
  const stockCount = product.stock || 0;
  const stockStatus = stockCount > 10 ? "In Stock" : stockCount > 0 ? "Low Stock" : "Out of Stock";
  const isInStock = stockCount > 0;

  return (
    <TouchableOpacity
      key={product.id}
      style={{ 
        width: "100%", // Changed to 100% to fill the FlashList column
        backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
        marginBottom: 16,
      }}
      className="rounded-3xl overflow-hidden"
      activeOpacity={0.8}
      onPress={() => router.push(`/product/${product.id}`)}
    >
      <View className="relative">
        <LottieImage
          uri={product.image || (product.images && product.images[0]) || ""}
          style={{ width: "100%", height: 176 }}
          bgColor={isDark ? "#1A1A1A" : "#F3F4F6"}
          lottieSize={60}
          cachePolicy="memory-disk"
        />
        
        <View style={{ position: "absolute", top: 10, left: 10 }}>
          <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.6)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 10, fontWeight: "800" }}>Premium</Text>
          </View>
        </View>

        <View style={{ position: "absolute", bottom: 10, left: 10, flexDirection: 'row', gap: 6 }}>
          {product.country === 'china' && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.75)", borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.5)", alignItems: 'center' }}>
              <Text style={{ color: "#FF4D4D", fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>CHINA</Text>
            </View>
          )}
          {product.country === 'pakistan' && (
            <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.75)", borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.5)", alignItems: 'center' }}>
              <Text style={{ color: "#10B981", fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>PAKISTAN</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          className="absolute top-3 right-3 p-2 rounded-full"
          style={{ backgroundColor: isDark ? "rgba(0,0,0,0.35)" : "rgba(255,255,255,0.75)", borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.95)" }}
          activeOpacity={0.7}
          onPress={() => toggleWishlist(product.id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name={isInWishlist(product.id) ? "heart" : "heart-outline"} size={18} color={isInWishlist(product.id) ? "#FF6B6B" : (isDark ? "#FFFFFF" : "#1F2937")} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="absolute top-16 right-3 p-2.5 rounded-full"
          style={{ backgroundColor: '#2563EB', borderWidth: 1.5, borderColor: '#1D4ED8', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 }}
          activeOpacity={0.7}
          onPress={() => handleShareProduct(product)}
        >
          <Ionicons name="share-outline" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View className="p-3" style={{ height: 125, justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.textSecondary }} className="text-[10px] mb-1 uppercase tracking-widest" numberOfLines={1}>{product.category}</Text>
          <Text style={{ color: colors.text }} className="font-extrabold text-sm" numberOfLines={1} ellipsizeMode="tail">{product.name}</Text>
          
          {/* Stock Status */}
          <View className="flex-row items-center mt-1">
            <View className={`px-2 py-0.5 rounded-full ${
              stockCount > 10 ? 'bg-green-100' : 
              stockCount > 0 ? 'bg-yellow-100' : 
              'bg-red-100'
            }`}>
              <Text className={`text-[9px] font-bold ${
                stockCount > 10 ? 'text-green-700' : 
                stockCount > 0 ? 'text-yellow-700' : 
                'text-red-700'
              }`}>
                {stockStatus}: {stockCount} pcs
              </Text>
            </View>
          </View>
        </View>
        
        <View className="flex-col gap-1 mt-auto">
          {/* Price with discount */}
          <View className="flex-row items-center gap-2">
            <Text style={{ color: colors.primary }} className="font-extrabold text-base">Rs. {product.price?.toLocaleString() || "0"}</Text>
            <Text style={{ color: colors.textSecondary, textDecorationLine: 'line-through' }} className="text-xs">Rs. {originalPrice.toLocaleString()}</Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1">
              <View className="px-2 py-0.5 rounded-full bg-red-500">
                <Text className="text-[9px] font-bold text-white">-{discount}%</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Ionicons name="shield-checkmark" size={9} color="#10B981" />
                <Text style={{ color: '#10B981', fontSize: 9, fontWeight: '800' }}>COD</Text>
              </View>
            </View>
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, shadowColor: "#2563EB", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 }}
              className="rounded-full w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
              onPress={() => router.push(`/product/${product.id}`)}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ProductsGrid = ({
  products,
  isLoading,
  isError,
}: ProductsGridProps) => {
  const { colors, isDark } = useTheme();
  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const handleShareProduct = async (product: Product) => {
    try {
      const productUrl = `https://zamanmall.netlify.app/product/${product.id}`;
      const shareMessage = `Check out this product on Zaman Mall!\n\n${product.name}\n\nPrice: Rs. ${product.price?.toLocaleString() || '0'}\n\n🔗 View here: ${productUrl}`.trim();
      await Share.share({ message: shareMessage, url: productUrl });
    } catch (error: any) {
      console.error('Error sharing product:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-row flex-wrap justify-between">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={{ width: "49.2%" }}>
            <ProductSkeleton />
          </View>
        ))}
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-10">
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ color: colors.text }} className="mt-4 text-center font-black uppercase tracking-widest">Failed to load products</Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap justify-between">
      {products.map((product) => renderProduct(product, colors, isDark, toggleWishlist, isInWishlist, isAddingToWishlist, isRemovingFromWishlist, handleShareProduct))}
    </View>
  );
};

export default ProductsGrid;
