import { ViewStyle } from "react-native";

export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/50";
    case "shipped":
      return "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/50";
    case "pending":
      return "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/50";
    case "processing":
      return "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/50";
    case "cancelled":
      return "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/50";
    default:
      return "bg-gradient-to-r from-gray-500 to-slate-600 text-white shadow-lg shadow-gray-500/50";
  }
};

type GlassPalette = {
  glassSurface: string;
  glassBorder: string;
  glassShadow: string;
  glassHighlight: string;
};

export const getGlassCardStyle = (
  colors: GlassPalette,
  isDark: boolean,
  extra?: ViewStyle
): ViewStyle => ({
  backgroundColor: colors.glassSurface,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: 24,
  overflow: "hidden",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: isDark ? 0.24 : 0.12,
  shadowRadius: 16,
  elevation: isDark ? 4 : 7,
  ...extra,
});

export const getGlassChipStyle = (
  colors: GlassPalette,
  radius = 999
): ViewStyle => ({
  backgroundColor: colors.glassHighlight,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderRadius: radius,
});
