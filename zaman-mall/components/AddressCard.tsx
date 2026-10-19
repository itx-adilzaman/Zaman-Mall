import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Address } from "@/types";
import { useTheme } from "@/context/ThemeContext";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (addressId: string, label: string) => void;
  isUpdatingAddress: boolean;
  isDeletingAddress: boolean;
}

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  isUpdatingAddress,
  isDeletingAddress,
}: AddressCardProps) {
  const { colors } = useTheme();

  return (
    <View 
      className="rounded-3xl p-5 mb-3 border"
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}
    >
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View 
            className="rounded-full w-12 h-12 items-center justify-center mr-3"
            style={{ backgroundColor: colors.primary + '1A' }} // 10% opacity
          >
            <Ionicons name="location" size={24} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text }} className="font-bold text-lg">{address.label}</Text>
        </View>
        {address.isDefault && (
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.primary }}
          >
            <Text className="text-black text-xs font-bold">Default</Text>
          </View>
        )}
      </View>
      <View className="ml-12">
        <Text style={{ color: colors.text }} className="font-semibold mb-1">{address.fullName}</Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-1">{address.streetAddress}</Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm mb-2">
          {address.city}, {address.province}
        </Text>
        <Text style={{ color: colors.textSecondary }} className="text-sm">{address.phone}</Text>
      </View>
      <View className="flex-row mt-6 gap-3">
        <TouchableOpacity
          className="flex-1 py-3.5 rounded-xl items-center border"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
          activeOpacity={0.7}
          onPress={() => onEdit(address)}
          disabled={isUpdatingAddress}
        >
          <Text style={{ color: colors.text }} className="font-bold">Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-1 py-3.5 rounded-xl items-center"
          style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
          activeOpacity={0.7}
          onPress={() => onDelete(address.id, address.label)}
          disabled={isDeletingAddress}
        >
          <Text className="text-red-500 font-bold">Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

