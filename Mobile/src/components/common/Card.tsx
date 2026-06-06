import React from 'react';
import { StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { MotiView } from 'moti';
import { Colors } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

export const Card: React.FC<CardProps> = ({ children, style, delay = 0 }) => {
  const { colors } = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 350, delay }}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
    >
      {children}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20, // Large radius
    padding: 20,
    marginBottom: 16,
    // Subtle shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
});
