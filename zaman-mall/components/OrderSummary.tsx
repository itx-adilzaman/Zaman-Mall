import { View, Text } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
}

export default function OrderSummary({ subtotal, shipping, total }: OrderSummaryProps) {
  const { colors } = useTheme();

  return (
    <View className="px-6 mt-6">
      <View
        style={{ backgroundColor: colors.glassSurface, borderColor: colors.glassBorder, borderWidth: 1 }}
        className="rounded-3xl p-5"
      >
        <Text style={{ color: colors.text }} className="text-xl font-bold mb-4">Summary</Text>

        <View className="space-y-3">
          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.textSecondary }} className="text-base">Subtotal</Text>
            <Text style={{ color: colors.text }} className="font-semibold text-base">
              Rs. {(subtotal || 0).toLocaleString()}
            </Text>
          </View>

          <View className="flex-row justify-between items-center mb-3">
            <Text style={{ color: colors.textSecondary }} className="text-base">Shipping</Text>
            <Text style={{ color: colors.text }} className="font-semibold text-base">
              Rs. {(shipping || 0).toLocaleString()}
            </Text>
          </View>

          {/* Divider */}
          <View style={{ borderTopColor: colors.border }} className="border-t pt-3 mt-1" />

          {/* Total */}
          <View className="flex-row justify-between items-center mt-3">
            <Text style={{ color: colors.text }} className="font-bold text-lg">Total</Text>
            <Text style={{ color: colors.primary }} className="font-bold text-2xl">Rs. {(total || 0).toLocaleString()}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
