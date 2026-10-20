import 'react-native-url-polyfill/auto';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, ActivityIndicator, Text } from 'react-native';
import {
  useFonts,
  Lora_400Regular,
  Lora_500Medium,
  Lora_600SemiBold,
  Lora_700Bold,
  Lora_400Regular_Italic,
} from '@expo-google-fonts/lora';
import { AuthProvider } from './src/context/AuthContext';
import { BadgeProvider } from './src/context/BadgeContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors, fonts } from './src/theme/colors';

// ── Global font override ──────────────────────────────────────────────────────
// Patch Text's defaultProps so every <Text> in the app uses Lora by default.
// Individual fontWeight styles are mapped to the correct Lora variant.
const originalRender = (Text as any).render;
(Text as any).render = function (...args: any[]) {
  const origin = originalRender.call(this, ...args);
  if (!origin) return origin;
  const style = origin.props?.style;
  const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style || {};
  const weight = flatStyle.fontWeight;

  let fontFamily = fonts.regular;
  if (weight === '700' || weight === 'bold' || weight === '800' || weight === '900') {
    fontFamily = fonts.bold;
  } else if (weight === '600' || weight === 'semibold') {
    fontFamily = fonts.semiBold;
  } else if (weight === '500') {
    fontFamily = fonts.medium;
  }

  return React.cloneElement(origin, {
    style: [{ fontFamily }, style],
  });
};
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_500Medium,
    Lora_600SemiBold,
    Lora_700Bold,
    Lora_400Regular_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <BadgeProvider>
            <StatusBar style="light" backgroundColor="#010409" translucent={false} />
            <AppNavigator />
          </BadgeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
