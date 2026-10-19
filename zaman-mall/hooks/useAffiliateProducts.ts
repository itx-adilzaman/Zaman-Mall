import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AffiliateProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url: string;
  images: string[];
  affiliate_url: string;
  brand_id?: string | null;
  brand_name?: string | null;
  category: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
}

const useAffiliateProducts = () => {
  const { data: products = [], isLoading, error, refetch } = useQuery<AffiliateProduct[]>({
    queryKey: ["affiliate_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_products")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("[useAffiliateProducts] fetch error:", error.message);
        throw error;
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const featured = products.filter(p => p.is_featured);

  return { products, featured, isLoading, error: error as Error | null, refetch };
};

export default useAffiliateProducts;
