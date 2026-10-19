import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../context/ThemeContext";

const SafeScreen = ({ children }: { children: React.ReactNode }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <View 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background, 
        paddingTop: insets.top 
      }}
    >
      {children}
    </View>
  );
};

export default SafeScreen;
