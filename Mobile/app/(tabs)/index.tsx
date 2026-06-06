import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Users, ArrowUpRight, ArrowDownLeft, Wallet, Bell, Sparkles } from 'lucide-react-native';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { groupService } from '../../src/services/groupService';
import { balanceService } from '../../src/services/balanceService';
import { invitationService } from '../../src/services/invitationService';
import { personalExpenseService } from '../../src/services/personalExpenseService';
import { settlementService } from '../../src/services/settlementService';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';
import { Avatar } from '../../src/components/common/Avatar';
import { StatCard } from '../../src/components/common/StatCard';
import { GroupCard } from '../../src/components/common/GroupCard';

// Cast icons to avoid React 19 typing issues
const LogOutIcon = LogOut as any;
const UsersIcon = Users as any;
const ArrowUpRightIcon = ArrowUpRight as any;
const ArrowDownLeftIcon = ArrowDownLeft as any;
const WalletIcon = Wallet as any;
const BellIcon = Bell as any;
const SparklesIcon = Sparkles as any;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const {
    data: personalExpenses = [],
    isLoading: loadingPersonal,
    refetch: refetchPersonal
  } = useQuery({
    queryKey: ['personalExpenses'],
    queryFn: personalExpenseService.getAllExpenses,
  });

  const {
    data: groups = [],
    isLoading: loadingGroups,
    refetch: refetchGroups
  } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.listGroups,
  });

  const {
    data: pendingInvitations = [],
    isLoading: loadingInvitations,
    refetch: refetchInvitations
  } = useQuery({
    queryKey: ['pendingInvitations'],
    queryFn: invitationService.getPendingInvitations,
  });

  const {
    data: pendingSettlements = [],
    isLoading: loadingSettlements,
    refetch: refetchSettlements
  } = useQuery({
    queryKey: ['pendingSettlements'],
    queryFn: settlementService.getPendingSettlements,
  });

  const {
    data: globalBalances = { owedToYou: 0, youOwe: 0 },
    isLoading: loadingBalances,
    refetch: refetchBalances
  } = useQuery({
    queryKey: ['globalBalances', groups.map(g => g.id)],
    enabled: groups.length > 0,
    queryFn: async () => {
      let totalOwed = 0;
      let totalOwe = 0;

      const balancePromises = groups.map(group =>
        balanceService.getBalances(group.id)
          .catch(() => [])
      );

      const allGroupBalances = await Promise.all(balancePromises);

      allGroupBalances.forEach(groupBalances => {
        const myBalance = groupBalances.find(b =>
          b.name.toLowerCase() === user.name?.toLowerCase() ||
          b.userId.toString() === user.id
        );

        if (myBalance) {
          if (myBalance.balance > 0) {
            totalOwed += myBalance.balance;
          } else if (myBalance.balance < 0) {
            totalOwe += Math.abs(myBalance.balance);
          }
        }
      });

      return {
        owedToYou: totalOwed,
        youOwe: totalOwe,
      };
    }
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchPersonal(),
      refetchGroups(),
      refetchInvitations(),
      refetchSettlements(),
      refetchBalances(),
    ]);
    setRefreshing(false);
  };

  // Aggregators
  const totalPersonalSpend = useMemo(() => {
    return personalExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [personalExpenses]);

  const totalNotifications = pendingInvitations.length + pendingSettlements.length;
  const isLoadingAny = loadingPersonal || loadingGroups || loadingInvitations || loadingSettlements || (groups.length > 0 && loadingBalances);

  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning';
    if (hours < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const firstFirstName = user?.name ? user.name.split(' ')[0] : 'Sai';
  const contrastIconColor = colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF';

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header Greeting Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Avatar name={user.name || 'Sai'} size={40} style={styles.headerAvatar} />
          <View>
            <Text style={[styles.welcome, { color: colors.muted }]}>{greeting},</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{firstFirstName}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.bellButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <BellIcon size={20} color={totalNotifications > 0 ? colors.primary : colors.muted} />
            {totalNotifications > 0 && (
              <View style={[styles.notificationDot, { backgroundColor: colors.primary }]}>
                <Text style={[styles.dotText, { color: colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF' }]}>{totalNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={logout}
            activeOpacity={0.7}
          >
            <LogOutIcon size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* Alerts Banner */}
        {totalNotifications > 0 && (
          <TouchableOpacity
            style={[styles.invitationBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.9}
          >
            <SparklesIcon size={16} color={colors.primary} />
            <Text style={[styles.invitationText, { color: colors.primary }]}>
              You have {totalNotifications} pending approval{totalNotifications > 1 ? 's' : ''}!
            </Text>
          </TouchableOpacity>
        )}

        {/* Bento Grid layout */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Financial Vault Overview</Text>

        {isLoadingAny ? (
          <View style={styles.bentoGrid}>
            <Skeleton height={140} style={[styles.bentoFull, { borderRadius: 20, marginBottom: 12 }]} />
            <View style={styles.bentoRow}>
              <Skeleton height={100} style={[styles.bentoHalf, { borderRadius: 20 }]} />
              <Skeleton height={100} style={[styles.bentoHalf, { borderRadius: 20 }]} />
            </View>
            <Skeleton height={100} style={[styles.bentoFull, { borderRadius: 20, marginTop: 12 }]} />
          </View>
        ) : (
          <View style={styles.bentoGrid}>
            {/* Main Personal Spend Card */}
            <TouchableOpacity
              style={[styles.bentoFull, { marginBottom: 12 }]}
              onPress={() => router.push('/personal-expenses')}
              activeOpacity={0.8}
            >
              <Card style={[styles.mainCard, { borderLeftColor: colors.primary }]} delay={50}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardLabel, { color: colors.muted }]}>Personal Spending</Text>
                  <WalletIcon size={18} color={colors.primary} />
                </View>
                <Text style={[styles.cardValue, { color: colors.text }]}>₹{totalPersonalSpend.toLocaleString()}</Text>
                <Text style={[styles.cardSubtext, { color: colors.muted }]}>Tap to view individual transaction ledgers</Text>
              </Card>
            </TouchableOpacity>

            {/* Owed & Owe grid row */}
            <View style={styles.bentoRow}>
              <StatCard
                label="Owed to You"
                value={`₹${globalBalances.owedToYou.toLocaleString()}`}
                subtext="Receivables"
                icon={<ArrowUpRightIcon size={16} color={colors.primary} />}
                accentColor={colors.primary}
                style={styles.bentoHalf}
                delay={100}
              />
              <StatCard
                label="You Owe"
                value={`₹${globalBalances.youOwe.toLocaleString()}`}
                subtext="Group Debts"
                icon={<ArrowDownLeftIcon size={16} color={colors.error} />}
                accentColor={colors.error}
                style={styles.bentoHalf}
                delay={150}
              />
            </View>

            {/* Groups Bento card */}
            <TouchableOpacity
              style={[styles.bentoFull, { marginTop: 12 }]}
              onPress={() => router.push('/(tabs)/explore')}
              activeOpacity={0.8}
            >
              <Card style={[styles.groupBentoCard, { borderLeftColor: colors.primary }]} delay={200}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardLabel, { color: colors.muted }]}>Active Groups</Text>
                  <UsersIcon size={18} color={colors.primary} />
                </View>
                <Text style={[styles.cardValueMedium, { color: colors.text }]}>{groups.length}</Text>
                <Text style={[styles.cardSubtext, { color: colors.muted }]}>Shared multi-party vault pools</Text>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/personal-expenses/create')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primary }]}>
              <WalletIcon size={20} color={contrastIconColor} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>Log Personal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/modal')}
            activeOpacity={0.75}
          >
            <View style={[styles.actionIconContainer, { backgroundColor: colors.primary }]}>
              <UsersIcon size={20} color={contrastIconColor} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>New Group</Text>
          </TouchableOpacity>
        </View>

        {/* Active Groups List Preview */}
        <View style={styles.groupsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Collaborative Vaults</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')} activeOpacity={0.7}>
            <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <Card style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.text }]}>No active groups found</Text>
            <Text style={[styles.emptySubtext, { color: colors.muted }]}>Create or join a group to start splitting bills</Text>
          </Card>
        ) : (
          groups.slice(0, 3).map((group, idx) => (
            <GroupCard
              key={group.id}
              name={group.name}
              description={group.description || 'Shared Expense Group'}
              tag="ACTIVE"
              activityText="Updated recently"
              onPress={() => router.push(`/groups/${group.id}`)}
              delay={250 + idx * 50}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  welcome: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dotText: {
    color: '#000000',
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  invitationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(215, 255, 63, 0.15)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  invitationText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    textAlign: 'center',
  },
  container: {
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
    marginTop: 8,
  },
  bentoGrid: {
    marginBottom: 20,
  },
  bentoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoFull: {
    width: '100%',
  },
  bentoHalf: {
    flex: 1,
  },
  mainCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 18,
    marginBottom: 0,
  },
  groupBentoCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    padding: 18,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 34,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardValueMedium: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  cardSubtext: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 12,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    textTransform: 'uppercase',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    borderRadius: 20,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  emptySubtext: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 4,
  },
});
