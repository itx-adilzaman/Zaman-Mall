import { supabase } from "@/lib/supabase";
import { Product } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useCountrySession } from "@/context/CountrySessionContext";

const useProducts = () => {
  const { currentSession } = useCountrySession();

  const result = useQuery({
    queryKey: ["products", currentSession],
    queryFn: async ({ signal }) => {
      let query = supabase
        .from("products")
        .select("*")
        .abortSignal(signal);

      // Filter by country session
      if (currentSession) {
        query = query.eq('country', currentSession);
      }

      // Set high limit to load all products (override Supabase default of 1000)
      const { data, error } = await query.limit(10000);

      if (error) throw error;

      const mappedProducts = (data || []).map((item: any) => ({
        ...item,
        price: item.price || 0,
        averageRating: item.average_rating,
        totalReviews: item.total_reviews,
      })) as Product[];

      return mappedProducts;
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    ...result,
    data: result.data ?? [],
  };
};

export default useProducts;
