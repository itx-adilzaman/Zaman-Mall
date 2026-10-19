import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Product } from "@/types";

export const useProduct = (productId: string) => {
  const result = useQuery<Product>({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();
        
      if (error) throw error;
      
      const product = {
        ...data,
        price: data.price || 0,
        averageRating: data.average_rating,
        totalReviews: data.total_reviews,
        videos: data.videos || [],
      };
      
      return product as Product;
    },
    enabled: !!productId,
  });

  return result;
};
