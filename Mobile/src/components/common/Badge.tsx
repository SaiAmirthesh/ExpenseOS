import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { Colors } from '../../theme/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info';
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'info',
  style,
  textStyle,
}) => {
  const getBadgeStyles = () => {
    switch (variant) {
      case 'success':
        return styles.success;
      case 'warning':
        return styles.warning;
      case 'danger':
        return styles.danger;
      case 'info':
      default:
        return styles.info;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'success':
        return styles.textSuccess;
      case 'warning':
        return styles.textWarning;
      case 'danger':
        return styles.textDanger;
      case 'info':
      default:
        return styles.textInfo;
    }
  };

  return (
    <View style={[styles.badge, getBadgeStyles(), style]}>
      <Text style={[styles.text, getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  success: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: 'rgba(215, 255, 63, 0.15)',
  },
  warning: {
    backgroundColor: 'rgba(255, 184, 77, 0.08)',
    borderColor: 'rgba(255, 184, 77, 0.15)',
  },
  danger: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  info: {
    backgroundColor: 'rgba(180, 188, 208, 0.08)',
    borderColor: 'rgba(180, 188, 208, 0.15)',
  },
  text: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textSuccess: {
    color: Colors.primary, // Primary lime color
  },
  textWarning: {
    color: Colors.warning,
  },
  textDanger: {
    color: Colors.error,
  },
  textInfo: {
    color: Colors.muted,
  },
});
