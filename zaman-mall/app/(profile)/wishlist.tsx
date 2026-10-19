import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import PremiumButton from "@/components/PremiumButton";

function WishlistScreen() {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const router = useRouter();
  const { wishlist, isLoading, isError, removeFromWishlist, isRemovingFromWishlist, refetch } =
    useWishlist();

  const { addToCart, isAddingToCart } = useCart();

  const handleRemoveFromWishlist = (productId: string, productName: string) => {
    showAlert({
      title: "Remove from wishlist",
      message: `Remove ${productName} from wishlist?`,
      icon: "heart-dislike-outline",
      buttons: [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => removeFromWishlist(productId),
        },
      ],
    });
  };

  const handleAddToCart = (product: Product) => {
    addToCart(
      { product, quantity: 1 },
      {
        onSuccess: () => {
          showAlert({
            title: "Success",
            message: `${product.name} added to cart!`,
            icon: "cart-outline",
            buttons: [{ text: "Great", onPress: () => {} }]
          });
        },
        onError: (error: any) => {
          showAlert({
            title: "Error",
            message: error?.response?.data?.error || "Failed to add to cart",
            icon: "alert-circle-outline",
            buttons: [{ text: "OK", onPress: () => {} }]
          });
        },
      }
    );
  };

  if (isLoading) return <LoadingUI colors={colors} />;
  if (isError) return <ErrorUI refetch={refetch} colors={colors} />;

  return (
    <SafeScreen>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* HEADER */}
        <View 
          className="px-6 pt-4 pb-4 flex-row items-center border-b z-10"
          style={{ 
            backgroundColor: colors.background, 
            borderBottomColor: colors.glassBorder 
          }}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 items-center justify-center rounded-full mr-4 shadow-sm"
            style={{ backgroundColor: colors.glassSurface }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">My Wishlist</Text>
          <View 
            className="ml-auto px-3 py-1 rounded-full border"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <Text style={{ color: colors.textSecondary }} className="text-xs font-medium">
              {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
            </Text>
          </View>
        </View>

        {wishlist.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <View 
              className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-lg shadow-black/20"
              style={{ backgroundColor: colors.glassSurface }}
            >
              <Ionicons name="heart-dislike-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={{ color: colors.text }} className="font-bold text-xl mb-2">
              Your wishlist is empty
            </Text>
            <Text style={{ color: colors.textSecondary }} className="text-center mt-2 mb-8 max-w-[250px] leading-6">
              Start adding products you love to your wishlist!
            </Text>
            <PremiumButton
              title="Browse Products"
              colors={[colors.primary, colors.primary] as [string, string]}
              onPress={() => router.push("/")}
            />
          </View>
        ) : (
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
            refreshControl={
              <RefreshControl 
                refreshing={isLoading} 
                onRefresh={refetch} 
                tintColor={colors.primary} 
              />
            }
          >
            {wishlist.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="rounded-3xl overflow-hidden mb-4 border shadow-sm"
                style={{ 
                  backgroundColor: colors.glassSurface,
                  borderColor: colors.glassBorder
                }}
                activeOpacity={0.9}
                onPress={() => router.push(`/product/${item.id}`)}
              >
                <View className="flex-row p-4">
                  <View className="relative">
                    <Image
                      source={item.images?.[0] || item.image}
                      className="rounded-2xl"
                      style={{ 
                        width: 100, 
                        height: 100, 
                        borderRadius: 16,
                        backgroundColor: colors.background 
                      }}
                      contentFit="cover"
                      transition={200}
                    />
                    {!item.stock && (
                       <View className="absolute inset-0 bg-black/60 rounded-2xl items-center justify-center">
                         <Text className="text-white text-xs font-bold uppercase">Out of Stock</Text>
                       </View>
                    )}
                  </View>

                  <View className="flex-1 ml-4 justify-between py-1">
                    <View>
                      <View className="flex-row justify-between items-start">
                        <Text 
                          style={{ color: colors.text }}
                          className="font-bold text-base flex-1 mr-2 leading-tight" 
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                        <TouchableOpacity
                          className="w-8 h-8 items-center justify-center rounded-full"
                          style={{ backgroundColor: colors.background + '80' }} // 50% opacity
                          activeOpacity={0.7}
                          onPress={() => handleRemoveFromWishlist(item.id, item.name)}
                          disabled={isRemovingFromWishlist}
                        >
                          <Ionicons name="heart" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      
                      <Text style={{ color: colors.primary }} className="font-bold text-lg mt-1">
                        Rs. {(item.price || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      {item.stock > 0 ? (
                        <View 
                          className="flex-row items-center px-2 py-1 rounded-md"
                          style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                        >
                          <View className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5" />
                          <Text className="text-green-500 text-xs font-bold">In Stock</Text>
                        </View>
                      ) : (
                        <View 
                          className="flex-row items-center px-2 py-1 rounded-md"
                          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                        >
                          <View className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5" />
                          <Text className="text-red-500 text-xs font-bold">Out of Stock</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                {item.stock > 0 && (
                  <View className="px-4 pb-4">
                    <PremiumButton
                      title="Add to Cart"
                      colors={[colors.primary, colors.primary] as [string, string]}
                      onPress={() => handleAddToCart(item)}
                      disabled={isAddingToCart}
                      loading={isAddingToCart}
                    />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeScreen>
  );
}

export default WishlistScreen;

function LoadingUI({ colors }: { colors: any }) {
  return (
    <SafeScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View 
          className="px-6 pt-4 pb-4 flex-row items-center border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.glassBorder
          }}
        >
          <View 
            className="w-10 h-10 rounded-full mr-4" 
            style={{ backgroundColor: colors.glassSurface }}
          />
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">My Wishlist</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }} className="mt-4 font-medium">Loading wishlist...</Text>
        </View>
      </View>
    </SafeScreen>
  );
}

function ErrorUI({ refetch, colors }: { refetch: () => void, colors: any }) {
  return (
    <SafeScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View 
          className="px-6 pt-4 pb-4 flex-row items-center border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.glassBorder
          }}
        >
          <View 
            className="w-10 h-10 rounded-full mr-4" 
            style={{ backgroundColor: colors.glassSurface }}
          />
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">My Wishlist</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View 
            className="w-20 h-20 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          >
            <Ionicons name="alert-circle-outline" size={40} color="#EF4444" />
          </View>
          <Text style={{ color: colors.text }} className="font-bold text-xl mt-2">
            Something went wrong
          </Text>
          <Text style={{ color: colors.textSecondary }} className="text-center mt-2 mb-6">
            We couldn&apos;t load your wishlist. Please try again.
          </Text>
          <TouchableOpacity
            onPress={refetch}
            className="border px-6 py-3 rounded-xl"
            style={{ 
              backgroundColor: colors.glassSurface,
              borderColor: colors.glassBorder
            }}
          >
            <Text style={{ color: colors.text }} className="font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
}

