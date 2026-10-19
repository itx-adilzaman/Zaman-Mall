import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface AffiliateBrand {
  id: string;
  name: string;
  name_urdu?: string | null;
  logo_url: string;
  affiliate_url: string;
  description?: string | null;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
}

const useAffiliateBrands = () => {
  const { data: brands = [], isLoading, error, refetch } = useQuery<AffiliateBrand[]>({
    queryKey: ["affiliate_brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_brands")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("[useAffiliateBrands] fetch error:", error.message);
        throw error;
      }
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // cache 5 minutes
  });

  // Group brands by category
  const grouped = brands.reduce<Record<string, AffiliateBrand[]>>((acc, brand) => {
    const cat = brand.category || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(brand);
    return acc;
  }, {});

  return {
    brands,
    grouped,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};

export default useAffiliateBrands;
