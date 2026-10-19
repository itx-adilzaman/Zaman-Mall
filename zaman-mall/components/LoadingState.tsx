import { View, Text, ActivityIndicator } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface LoadingStateProps {
  message?: string;
  color?: string;
}

const LoadingState = ({ message = "Loading...", color }: LoadingStateProps) => {
  const { colors } = useTheme();
  
  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: colors.background }}>
      <ActivityIndicator size={"large"} color={color || colors.primary} />
      <Text style={{ color: colors.textSecondary }} className="mt-4">{message}</Text>
    </View>
  );
};

export default LoadingState;
