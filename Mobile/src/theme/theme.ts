import { DarkTheme } from '@react-navigation/native';

export const Colors = {
  background: '#0B1020', // Dark navy base
  surface: '#141C2F',    // Modern banking surface
  card: '#1B2438',       // Card navy
  primary: '#D7FF3F',    // Neon lime primary
  accentHover: '#C6F234',
  text: '#FFFFFF',
  muted: '#B4BCD0',      // Secondary text
  border: 'rgba(255, 255, 255, 0.08)',
  error: '#FF6B6B',      // Danger
  success: '#D7FF3F',
  warning: '#FFB84D',
  overlay: 'rgba(11, 16, 32, 0.8)',
};

export const Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
};


