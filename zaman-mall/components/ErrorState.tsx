import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please check your connection and try again",
  onRetry,
}: ErrorStateProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.background }}>
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text style={{ color: colors.text }} className="font-semibold text-xl mt-4">{title}</Text>
      <Text style={{ color: colors.textSecondary }} className="text-center mt-2">{description}</Text>
      {onRetry && (
        <TouchableOpacity 
          onPress={onRetry} 
          className="mt-4 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text style={{ color: '#FFFFFF' }} className="font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
