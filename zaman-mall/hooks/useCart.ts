import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CartItem, Product } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Alert } from "react-native";

interface CartState {
  items: CartItem[];
}

const useCart = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: cart = { items: [] },
    isLoading,
    isError,
  } = useQuery<CartState>({
    queryKey: ["cart", user?.id],
    queryFn: async ({ signal }) => {
      if (!user) return { items: [] };

      // Fetch cart items directly (denormalized table)
      const { data, error } = await supabase
        .from("cart")
        .select("*")
        .eq("userId", user.id)
        .abortSignal(signal);

      if (error) {
        console.error("Error fetching cart:", error);
        throw error;
      }

      // Map the raw data to match CartItem interface
      return {
        items: (data || []).map((item: any) => ({
          ...item,
          userId: item.user_id, // Map snake_case to camelCase
          baseProductId: item.baseProductId || item.product_id, // Handle both potential column names
          selectedVariants: item.selected_variants || item.selectedVariants, // Handle snake_case
          id: item.id,
          // If the UI expects product_id property on CartItem (even if not in interface), map it
          product_id: item.baseProductId || item.product_id,
          price: item.price,
          country: item.country,
        })) as CartItem[],
      };
    },
    enabled: !!user,
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ product, quantity = 1, variants, variantPrice }: { product: Product; quantity?: number; variants?: Record<string, string>; variantPrice?: number }) => {
      if (!user) throw new Error("User not logged in");

      const variantHash = variants ? btoa(JSON.stringify(variants)) : 'base';
      const cartId = `${user.id}_${product.id}_${variantHash}`;

      const { data: existing, error: fetchError } = await supabase
        .from("cart")
        .select("*")
        .eq("id", cartId)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing cart item:", fetchError);
        throw fetchError;
      }

      // Use variantPrice if provided, otherwise product base price
      const effectivePrice = variantPrice ?? product.price;

      if (existing) {
        const { error } = await supabase
          .from("cart")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", cartId);
        
        if (error) {
           console.error("Error updating cart item:", error);
           throw error;
        }
      } else {
        const { error } = await supabase
        .from("cart")
        .insert({
          id: cartId,
          userId: user.id,
          baseProductId: product.id,
          name: product.name,
          price: effectivePrice,
          image: product.image,
          category: product.category,
          country: product.country,
          quantity: quantity,
          selectedVariants: variants || {},
        });
        
        if (error) {
           console.error("Error adding cart item:", error);
           throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      if (!user) throw new Error("User not logged in");
      
      const { error } = await supabase
        .from("cart")
        .delete()
        .eq("id", cartItemId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      if (!user) throw new Error("User not logged in");

      if (quantity <= 0) {
        await removeFromCartMutation.mutateAsync(cartItemId);
        return;
      }

      const { error } = await supabase
        .from("cart")
        .update({ quantity })
        .eq("id", cartItemId);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] });
    },
  });

  return {
    cart,
    isLoading,
    isError,
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    cartItemCount: cart?.items?.length || 0,
    cartTotal: cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0,
    clearCart: () => {
      queryClient.setQueryData(["cart", user?.id], { items: [] });
    },
  };
};

export default useCart;