import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Edit2, Trash2 } from 'lucide-react-native';
import { Card } from './Card';
import { Colors } from '../../theme/theme';
import { Badge } from './Badge';
import { useTheme } from '../../theme/ThemeContext';

const Edit2Icon = Edit2 as any;
const Trash2Icon = Trash2 as any;

interface ExpenseCardProps {
  title: string;
  amount: number | string;
  date?: string;
  category: string;
  categoryColor?: string;
  categoryIcon?: React.ReactNode;
  paidByText?: string;
  splitText?: string;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
  delay?: number;
}

export const ExpenseCard: React.FC<ExpenseCardProps> = ({
  title,
  amount,
  date,
  category,
  categoryColor,
  categoryIcon,
  paidByText,
  splitText,
  onPress,
  onEdit,
  onDelete,
  style,
  delay = 0,
}) => {
  const { colors } = useTheme();
  const activeCategoryColor = categoryColor || colors.primary;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={{ width: '100%' }}
    >
      <Card
        style={[
          styles.card,
          { borderLeftColor: activeCategoryColor },
          style,
        ]}
        delay={delay}
      >
        <View style={styles.leftContainer}>
          {categoryIcon && (
            <View style={[styles.iconBox, { backgroundColor: `${activeCategoryColor}15` }]}>
              {categoryIcon}
            </View>
          )}
          <View style={styles.infoBox}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <View style={styles.metaRow}>
              <Badge 
                label={category.toLowerCase()} 
                style={[styles.badge, { borderColor: `${activeCategoryColor}30`, backgroundColor: `${activeCategoryColor}08` }]} 
                textStyle={{ color: activeCategoryColor }} 
              />
              {date && <Text style={[styles.metaText, { color: colors.muted }]}>{date}</Text>}
              {paidByText && <Text style={[styles.metaText, { color: colors.muted }]}>• {paidByText}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.rightContainer}>
          <Text style={[styles.amount, { color: activeCategoryColor === colors.primary ? colors.primary : colors.text }]}>
            {typeof amount === 'number' ? `₹${amount.toLocaleString()}` : amount}
          </Text>
          {splitText ? (
            <Text style={[styles.splitText, { color: colors.muted }]}>{splitText}</Text>
          ) : (
            (onEdit || onDelete) && (
              <View style={styles.actionsRow}>
                {onEdit && (
                  <TouchableOpacity onPress={onEdit} style={styles.iconBtn} activeOpacity={0.7}>
                    <Edit2Icon size={13} color={colors.muted} />
                  </TouchableOpacity>
                )}
                {onDelete && (
                  <TouchableOpacity onPress={onDelete} style={styles.iconBtn} activeOpacity={0.7}>
                    <Trash2Icon size={13} color={colors.error} />
                  </TouchableOpacity>
                )}
              </View>
            )
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoBox: {
    flex: 1,
  },
  title: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  metaText: {
    color: Colors.muted,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amount: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 16,
    marginBottom: 2,
  },
  splitText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  iconBtn: {
    padding: 4,
  },
});
