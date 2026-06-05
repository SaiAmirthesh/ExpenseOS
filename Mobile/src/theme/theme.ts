import { DarkTheme } from '@react-navigation/native';

export const Colors = {
  background: '#0A0A0A',
  surface: '#111111',
  card: '#151515',
  primary: '#39FF14', // Cyber Lime
  secondary: '#00E5FF', // Neon Cyan
  text: '#FFFFFF',
  muted: '#A0A0A0',
  border: 'rgba(255, 255, 255, 0.08)',
  error: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  overlay: 'rgba(0, 0, 0, 0.7)',
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
    notification: Colors.secondary,
  },
};

