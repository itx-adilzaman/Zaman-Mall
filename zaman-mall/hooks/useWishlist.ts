import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";

const useWishlist = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const {
    data: wishlist = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Product[]>({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: favoriteIds, error: favError } = await supabase
        .from("favorites")
        .select("productId")
        .eq("userId", user.id);

      if (favError) throw favError;

      if (!favoriteIds || favoriteIds.length === 0) return [];

      const productIds = favoriteIds.map((f: any) => f.productId);
      const { data: products, error: prodError } = await supabase
        .from("products")
        .select("*")
        .in("id", productIds);

      if (prodError) throw prodError;

      return (products || []).map((item: any) => ({
        ...item,
        price: item.price || 0,
        averageRating: item.average_rating,
        totalReviews: item.total_reviews,
      })) as Product[];
    },
    enabled: !!user,
  });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("User not logged in");
      
      const { error } = await supabase
        .from("favorites")
        .insert({ userId: user.id, productId: productId });
      
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] }),
    onError: (error) => showAlert({
      title: "Error",
      message: error.message,
      icon: "alert-circle-outline",
      buttons: [{ text: "OK", onPress: () => {} }]
    }),
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("User not logged in");

      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("userId", user.id)
        .eq("productId", productId);

      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] }),
    onError: (error) => showAlert({
      title: "Error",
      message: error.message,
      icon: "alert-circle-outline",
      buttons: [{ text: "OK", onPress: () => {} }]
    }),
  });

  const isInWishlist = (productId: string) => {
    return wishlist.some((product) => product.id === productId);
  };

  const toggleWishlist = (productId: string) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId);
    } else {
      addToWishlistMutation.mutate(productId);
    }
  };

  return {
    wishlist,
    isLoading,
    isError,
    wishlistCount: wishlist.length,
    isInWishlist,
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
    refetch,
  };
};

export default useWishlist;
