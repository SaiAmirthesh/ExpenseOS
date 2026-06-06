import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Card } from './Card';
import { Colors } from '../../theme/theme';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { useTheme } from '../../theme/ThemeContext';

const ChevronRightIcon = ChevronRight as any;

interface GroupCardProps {
  name: string;
  description?: string;
  tag?: string;
  membersCount?: number;
  membersList?: string[]; // Initials or names
  totalSpend?: number;
  yourShare?: number;
  activityText?: string;
  onPress: () => void;
  style?: ViewStyle;
  delay?: number;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  name,
  description,
  tag,
  membersCount = 0,
  membersList = [],
  totalSpend,
  yourShare,
  activityText,
  onPress,
  style,
  delay = 0,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={{ width: '100%' }}>
      <Card style={[styles.card, style]} delay={delay}>
        {/* Top tag and avatars row */}
        <View style={styles.topRow}>
          {tag ? (
            <Badge label={tag} variant="success" style={styles.badge} />
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {membersList.length > 0 && (
            <View style={styles.avatarsContainer}>
              {membersList.slice(0, 3).map((memberName, idx) => (
                <Avatar
                  key={idx}
                  name={memberName}
                  size={24}
                  style={[styles.avatar, { borderColor: colors.card, marginLeft: idx > 0 ? -10 : 0 }]}
                />
              ))}
              {membersCount > 3 && (
                <View style={[styles.avatarCount, styles.avatar, { backgroundColor: colors.surface, borderColor: colors.card, marginLeft: -10 }]}>
                  <Text style={[styles.avatarCountText, { color: colors.muted }]}>+{membersCount - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Title and Description */}
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        {description ? <Text style={[styles.desc, { color: colors.muted }]} numberOfLines={1}>{description}</Text> : null}

        {/* Total Spend & Your Share grid */}
        {(totalSpend !== undefined || yourShare !== undefined) && (
          <View style={[styles.financialsRow, { borderTopColor: colors.border }]}>
            {totalSpend !== undefined && (
              <View style={styles.finCol}>
                <Text style={[styles.finLabel, { color: colors.muted }]}>TOTAL SPEND</Text>
                <Text style={[styles.finValue, { color: colors.text }]}>₹{totalSpend.toLocaleString()}</Text>
              </View>
            )}
            {yourShare !== undefined && (
              <View style={styles.finCol}>
                <Text style={[styles.finLabel, { color: colors.muted }]}>YOUR SHARE</Text>
                <Text style={[styles.finValue, { color: colors.primary }]}>₹{yourShare.toLocaleString()}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer row */}
        <View style={[styles.footerRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.activityText, { color: colors.muted }]}>
            {activityText || 'Active Vault'}
          </Text>
          <View style={styles.ledgerAction}>
            <Text style={[styles.ledgerActionText, { color: colors.primary }]}>VIEW LEDGER</Text>
            <ChevronRightIcon size={14} color={colors.primary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    borderWidth: 1.5,
    borderColor: Colors.card,
  },
  avatarCount: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCountText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.muted,
  },
  name: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  desc: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginBottom: 16,
  },
  financialsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    marginBottom: 14,
    gap: 20,
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  finValue: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  activityText: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
  },
  ledgerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerActionText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.primary,
  },
});
