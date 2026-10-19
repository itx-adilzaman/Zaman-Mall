import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface Ad {
  id: string;
  title: string;
  image: string;
  active: boolean;
  link?: string;
  created_at: string;
}

const ADS_BATCH_SIZE = 10; // Load 10 ads at a time

export const useAds = () => {
  return useInfiniteQuery({
    queryKey: ["ads"],
    queryFn: async ({ pageParam = 0 }) => {
      const from = pageParam * ADS_BATCH_SIZE;
      const to = from + ADS_BATCH_SIZE - 1;
      
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        ads: data || [],
        nextPage: data.length === ADS_BATCH_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
};
