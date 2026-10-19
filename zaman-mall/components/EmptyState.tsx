import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  description?: string;
  header?: string;
}

export function EmptyState({
  icon = "folder-open-outline",
  iconSize = 80,
  title,
  description,
  header,
}: EmptyStateProps) {
  const { colors } = useTheme();

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      {header && (
        <View className="px-6 pt-16 pb-5">
          <Text style={{ color: colors.text }} className="text-3xl font-bold tracking-tight">{header}</Text>
        </View>
      )}
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name={icon} size={iconSize} color={colors.textSecondary} />
        <Text style={{ color: colors.text }} className="font-semibold text-xl mt-4">{title}</Text>
        {description && <Text style={{ color: colors.textSecondary }} className="text-center mt-2">{description}</Text>}
      </View>
    </View>
  );
}
