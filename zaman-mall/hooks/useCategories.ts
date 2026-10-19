import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  name_urdu: string | null;
  description: string | null;
  image_url: string;
  icon_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface UseCategoriesReturn {
  categories: Category[];
  isLoading: boolean;
  error: Error | null;
}

const useCategories = (): UseCategoriesReturn => {
  // Fetch all categories (read-only for mobile app)
  const { data: categories = [], isLoading, error } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }

      return data || [];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    categories,
    isLoading,
    error: error as Error | null,
  };
};

export default useCategories;
