import React, { useState } from 'react';
import { View, TextInput, Text, TextInputProps, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface PremiumTextInputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  containerClassName?: string;
}

const PremiumTextInput: React.FC<PremiumTextInputProps> = ({
  label,
  icon,
  rightIcon,
  onRightIconPress,
  error,
  containerClassName = '',
  style,
  placeholderTextColor,
  ...props
}) => {
  const { colors, isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View className={`mb-4 ${containerClassName}`}>
      {label && (
        <Text style={{ color: colors.textSecondary }} className="text-xs font-bold mb-2 ml-1 uppercase">
          {label}
        </Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.glassSurface,
            borderColor: error ? '#EF4444' : isFocused ? colors.primary : colors.glassBorder,
            borderWidth: error ? 2 : 1,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            style,
          ]}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons
              name={rightIcon}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={{ color: '#EF4444' }} className="text-xs mt-1 ml-1">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 30,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rightIcon: {
    marginLeft: 12,
  },
});

export default PremiumTextInput;
