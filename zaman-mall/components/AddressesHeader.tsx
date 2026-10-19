import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/context/ThemeContext";

export default function AddressesHeader() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View 
      className="px-6 pb-5 border-b flex-row items-center justify-between"
      style={{ borderBottomColor: colors.border }}
    >
      <View className="flex-row items-center">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="mr-4 w-10 h-10 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.surface }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ color: colors.text }} className="text-2xl font-bold tracking-tight">My Addresses</Text>
      </View>
      <View 
        className="w-12 h-12 rounded-full items-center justify-center border"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <Image 
          source={require("@/assets/images/zaman-logo.png")} 
          className="w-10 h-10 rounded-full"
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

