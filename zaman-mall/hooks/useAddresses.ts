import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Address } from "@/types";
import { useAuth } from "@/context/AuthContext";

export const useAddresses = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const {
    data: addresses = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["addresses", user?.id],
    queryFn: async ({ signal }) => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .abortSignal(signal);
      
      if (error) {
        console.error("Error fetching addresses:", error);
        throw error;
      }
      
      return (data || []).map((addr) => ({
        id: addr.id,
        userId: addr.user_id,
        label: addr.label,
        fullName: addr.full_name,
        phone: addr.phone,
        streetAddress: addr.street_address,
        city: addr.city,
        province: addr.province,
        district: addr.district,
        tehsil: addr.tehsil,
        isDefault: addr.is_default,
      })) as Address[];
    },
    enabled: !!user,
  });

  const addAddressMutation = useMutation({
    mutationFn: async (addressData: Omit<Address, "id" | "userId">) => {
      if (!user) throw new Error("User not logged in");
      
      console.log("Adding address with data:", addressData);
      
      const generatedId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log("Generated ID:", generatedId);
      
      const dbAddress = {
        id: generatedId,
        user_id: user.id,
        label: addressData.label,
        full_name: addressData.fullName,
        phone: addressData.phone,
        street_address: addressData.streetAddress,
        city: addressData.city,
        province: addressData.province,
        district: addressData.district,
        tehsil: addressData.tehsil,
        is_default: addressData.isDefault,
      };

      console.log("Final dbAddress:", dbAddress);

      const { data, error } = await supabase
        .from("addresses")
        .insert(dbAddress)
        .select()
        .single();

      if (error) {
        console.error("Error adding address:", error);
        throw error;
      }
      
      console.log("Address added successfully:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async ({
      addressId,
      addressData,
    }: {
      addressId: string;
      addressData: Partial<Address>;
    }) => {
       if (!user) throw new Error("User not logged in");

       const dbAddress: any = {};
       if (addressData.label !== undefined) dbAddress.label = addressData.label;
       if (addressData.fullName !== undefined) dbAddress.full_name = addressData.fullName;
       if (addressData.phone !== undefined) dbAddress.phone = addressData.phone;
       if (addressData.streetAddress !== undefined) dbAddress.street_address = addressData.streetAddress;
       if (addressData.city !== undefined) dbAddress.city = addressData.city;
       if (addressData.province !== undefined) dbAddress.province = addressData.province;
       if (addressData.district !== undefined) dbAddress.district = addressData.district;
       if (addressData.tehsil !== undefined) dbAddress.tehsil = addressData.tehsil;
       if (addressData.isDefault !== undefined) dbAddress.is_default = addressData.isDefault;

       const { error } = await supabase
         .from("addresses")
         .update(dbAddress)
         .eq("id", addressId)
         .eq("user_id", user.id);

       if (error) {
         console.error("Error updating address:", error);
         throw error;
       }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (addressId: string) => {
       if (!user) throw new Error("User not logged in");
       const { error } = await supabase
         .from("addresses")
         .delete()
         .eq("id", addressId)
         .eq("user_id", user.id);
         
       if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses", user?.id] });
    },
  });

  return {
    addresses,
    isLoading,
    isError,
    addAddress: addAddressMutation.mutate,
    updateAddress: updateAddressMutation.mutate,
    deleteAddress: deleteAddressMutation.mutate,
    isAddingAddress: addAddressMutation.isPending,
    isUpdatingAddress: updateAddressMutation.isPending,
    isDeletingAddress: deleteAddressMutation.isPending,
  };
};
