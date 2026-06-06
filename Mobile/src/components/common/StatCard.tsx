import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Card } from './Card';
import { Colors } from '../../theme/theme';
import { useTheme } from '../../theme/ThemeContext';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  style?: ViewStyle;
  delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon,
  accentColor,
  style,
  delay = 0,
}) => {
  const { colors } = useTheme();
  const activeAccent = accentColor || colors.primary;

  return (
    <Card style={[styles.card, { borderLeftColor: activeAccent }, style]} delay={delay}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
      </View>
      <Text style={[styles.value, { color: activeAccent === colors.primary ? colors.text : activeAccent }]}>
        {value}
      </Text>
      {subtext && <Text style={[styles.subtext, { color: colors.muted }]}>{subtext}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderLeftWidth: 3,
    padding: 18,
    marginBottom: 0, // Let container manage spacing
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-ExtraBold', // Large financial typography
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
  },
});
