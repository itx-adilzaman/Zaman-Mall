import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeType = 'light' | 'dark';

interface ThemeColors {
  background: string;
  surface: string;
  surfaceSecondary: string;
  primary: string;
  text: string;
  textSecondary: string;
  border: string;
  card: string;
  glow: string;
  glassSurface: string;
  glassSurfaceStrong: string;
  glassBorder: string;
  glassHighlight: string;
  glassShadow: string;
  glassTint: "light" | "dark";
}

const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F3F5',
  primary: '#1DB954',
  text: '#121212',
  textSecondary: '#6C757D',
  border: 'rgba(0,0,0,0.18)',
  card: '#FFFFFF',
  glow: 'rgba(29,185,84,0.1)',
  glassSurface: 'rgba(255,255,255,0.86)',
  glassSurfaceStrong: 'rgba(255,255,255,0.94)',
  glassBorder: 'rgba(0,0,0,0.12)',
  glassHighlight: 'rgba(255,255,255,0.80)',
  glassShadow: 'rgba(15,23,42,0.14)',
  glassTint: 'light',
};

const darkTheme: ThemeColors = {
  background: '#0A0A0A',
  surface: '#121212',
  surfaceSecondary: '#1A1A1A',
  primary: '#1DB954',
  text: '#FFFFFF',
  textSecondary: '#888888',
  border: 'rgba(255,255,255,0.15)',
  card: 'rgba(255,255,255,0.08)',
  glow: 'rgba(29,185,84,0.15)',
  glassSurface: 'rgba(255,255,255,0.12)',
  glassSurfaceStrong: 'rgba(255,255,255,0.18)',
  glassBorder: 'rgba(255,255,255,0.25)',
  glassHighlight: 'rgba(255,255,255,0.28)',
  glassShadow: 'rgba(0,0,0,0.35)',
  glassTint: 'dark',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@app_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme === 'dark' ? 'dark' : 'light');

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setTheme(savedTheme as ThemeType);
      }
    } catch (e) {
      console.error('Failed to load theme', e);
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
