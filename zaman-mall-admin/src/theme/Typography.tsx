/**
 * Override React Native's default Text component to always use Lora serif font.
 * Import Text from this file instead of 'react-native' across the app,
 * OR use the global override below in App.tsx.
 */
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { fonts } from './colors';

export function Text({ style, ...props }: TextProps) {
  return <RNText style={[styles.default, style]} {...props} />;
}

const styles = StyleSheet.create({
  default: {
    fontFamily: fonts.regular,
  },
});
