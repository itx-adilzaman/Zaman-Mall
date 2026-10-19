import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Review } from "@/types";

export const useReviews = (productId: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((review: any) => ({
        id: review.id,
        userId: review.user_id,
        userName: review.user_name || "Anonymous",
        avatar: review.avatar,
        rating: review.rating,
        comment: review.comment,
        date: review.created_at,
        images: review.images || []
      })) as Review[];
    },
    enabled: !!productId,
  });

  const addReviewMutation = useMutation({
    mutationFn: async ({ 
      rating, 
      comment, 
      images,
      orderId
    }: { 
      rating: number; 
      comment: string; 
      images?: string[];
      orderId?: string;
    }) => {
      if (!user) throw new Error("You must be logged in to review");

      const userName = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous";
      const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.avatar || null;

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          product_id: productId,
          orderId: orderId,
          rating,
          comment,
          images: images || [],
          user_name: userName,
          avatar: userAvatar
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding review:", error);
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
      // Also invalidate product details to update average rating if it's computed there
      queryClient.invalidateQueries({ queryKey: ["product", productId] });
      // Invalidate orders to update the "Reviewed" status button
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
    },
  });

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    isError: reviewsQuery.isError,
    addReview: addReviewMutation.mutate,
    isAddingReview: addReviewMutation.isPending,
  };
};
