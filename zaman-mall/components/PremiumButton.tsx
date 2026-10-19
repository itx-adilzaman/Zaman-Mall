import React, { useRef } from "react";
import { TouchableOpacity, Text, Animated, View, ViewStyle, TextStyle, TouchableOpacityProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface PremiumButtonProps extends TouchableOpacityProps {
  title: string;
  colors?: [string, string];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
}

const PremiumButton: React.FC<PremiumButtonProps> = ({
  title,
  colors = ["#2563EB", "#3B82F6"] as [string, string],
  style,
  textStyle,
  disabled = false,
  loading = false,
  onPress,
  ...rest
}) => {
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled || loading}
        style={{
          borderRadius: 999,
          overflow: "hidden",
          ...style,
        }}
        {...rest}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {loading ? (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                ...textStyle,
              }}
            >
              Loading...
            </Text>
          ) : (
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 15,
                fontWeight: "800",
                letterSpacing: 1.2,
                textTransform: "uppercase",
                ...textStyle,
              }}
            >
              {title}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PremiumButton;
