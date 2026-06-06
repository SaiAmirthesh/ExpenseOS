import React, { createContext, useContext, useState } from 'react';
import { getStorageItem, setStorageItem } from '../store/storage';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { Colors as StaticColors, Theme as StaticTheme } from './theme';

export type ThemeMode = 'navy' | 'black' | 'white';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  accentHover: string;
  success: string;
  warning: string;
  error: string;
  overlay: string;
}

const NavyColors: ThemeColors = {
  background: '#0B1020',
  surface: '#141C2F',
  card: '#1B2438',
  text: '#FFFFFF',
  muted: '#B4BCD0',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#D7FF3F',
  accentHover: '#C6F234',
  success: '#D7FF3F',
  warning: '#FFB84D',
  error: '#FF6B6B',
  overlay: 'rgba(11, 16, 32, 0.85)',
};

const BlackColors: ThemeColors = {
  background: '#000000',
  surface: '#0C0C0E',
  card: '#16161A',
  text: '#FFFFFF',
  muted: '#9E9EAF',
  border: 'rgba(255, 255, 255, 0.08)',
  primary: '#D7FF3F',
  accentHover: '#C6F234',
  success: '#D7FF3F',
  warning: '#FFB84D',
  error: '#FF6B6B',
  overlay: 'rgba(0, 0, 0, 0.85)',
};

const WhiteColors: ThemeColors = {
  background: '#F3F4F6',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  primary: '#0052FF',
  accentHover: '#0040D0',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  overlay: 'rgba(0, 0, 0, 0.4)',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  colors: ThemeColors;
  theme: any;
  updateThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (getStorageItem('profile.theme') as ThemeMode) || 'navy';
  });

  const updateThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    setStorageItem('profile.theme', mode);
  };

  const getColors = (): ThemeColors => {
    switch (themeMode) {
      case 'black':
        return BlackColors;
      case 'white':
        return WhiteColors;
      case 'navy':
      default:
        return NavyColors;
    }
  };

  const currentColors = getColors();

  const navigationTheme = {
    ...(themeMode === 'white' ? DefaultTheme : DarkTheme),
    dark: themeMode !== 'white',
    colors: {
      ...(themeMode === 'white' ? DefaultTheme.colors : DarkTheme.colors),
      primary: currentColors.primary,
      background: currentColors.background,
      card: currentColors.card,
      text: currentColors.text,
      border: currentColors.border,
      notification: currentColors.primary,
    },
  };

  return (
    <ThemeContext.Provider value={{ themeMode, colors: currentColors, theme: navigationTheme, updateThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
