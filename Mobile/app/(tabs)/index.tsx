import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Users, Plus, ArrowUpRight, ArrowDownLeft, Wallet, Bell } from 'lucide-react-native';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { groupService } from '../../src/services/groupService';
import { balanceService } from '../../src/services/balanceService';
import { invitationService } from '../../src/services/invitationService';
import { personalExpenseService } from '../../src/services/personalExpenseService';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';

// Cast icons to avoid React 19 typing issues
const LogOutIcon = LogOut as any;
const UsersIcon = Users as any;
const PlusIcon = Plus as any;
const ArrowUpRightIcon = ArrowUpRight as any;
const ArrowDownLeftIcon = ArrowDownLeft as any;
const WalletIcon = Wallet as any;
const BellIcon = Bell as any;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
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

  // Dynamically fetch balances for all groups to aggregate Owe / Owed totals
  // Since we cannot run dynamic hooks in loops, we do client-side query or trigger resolution
  // For the dashboard bento grid, we will retrieve balances for each group. 
  // To keep it simple and elegant, we can fetch all balances with a Promise.all in a query
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
          .catch(() => []) // Catch errors per-group to avoid complete failure
      );

      const allGroupBalances = await Promise.all(balancePromises);

      allGroupBalances.forEach(groupBalances => {
        // Find user balance record. Matches by email or name
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
      refetchBalances(),
    ]);
    setRefreshing(false);
  };

  // Aggregators
  const totalPersonalSpend = useMemo(() => {
    return personalExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [personalExpenses]);

  const isLoadingAny = loadingPersonal || loadingGroups || loadingInvitations || (groups.length > 0 && loadingBalances);

  return (
    <View style={[styles.safeArea, { paddingTop: Math.max(insets.top, 16) }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.userName}>{user.name || 'Premium User'}</Text>
          </View>
          <View style={styles.headerActions}>
            {pendingInvitations.length > 0 && (
              <TouchableOpacity
                style={styles.bellButton}
                onPress={() => router.push('/modal')} // Placeholder mapping to invitation view
                activeOpacity={0.7}
              >
                <BellIcon size={20} color={Colors.secondary} />
                <View style={styles.notificationDot} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={logout}
              activeOpacity={0.7}
            >
              <LogOutIcon size={20} color={Colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Invitations Alert */}
        {pendingInvitations.length > 0 && (
          <TouchableOpacity
            style={styles.invitationBanner}
            onPress={() => router.push('/modal')}
            activeOpacity={0.9}
          >
            <Text style={styles.invitationText}>
              You have {pendingInvitations.length} pending group invitation{pendingInvitations.length > 1 ? 's' : ''}!
            </Text>
          </TouchableOpacity>
        )}

        {/* Bento Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>

        {isLoadingAny ? (
          <View style={styles.bentoGrid}>
            <Skeleton height={140} style={styles.bentoFull} />
            <Skeleton height={100} style={styles.bentoHalf} />
            <Skeleton height={100} style={styles.bentoHalf} />
            <Skeleton height={120} style={styles.bentoFull} />
          </View>
        ) : (
          <View style={styles.bentoGrid}>
            {/* Main Personal Spend Card */}
            <Card style={[styles.bentoFull, styles.mainCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Personal Spending</Text>
                <WalletIcon size={18} color={Colors.primary} />
              </View>
              <Text style={styles.cardValue}>₹{totalPersonalSpend.toLocaleString()}</Text>
              <Text style={styles.cardSubtext}>Total tracked individual expenses</Text>
            </Card>

            {/* Owed to You Card */}
            <Card style={[styles.bentoHalf, styles.owedCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Owed to You</Text>
                <ArrowUpRightIcon size={18} color={Colors.primary} />
              </View>
              <Text style={[styles.cardValueSmall, { color: Colors.primary }]}>
                ₹{globalBalances.owedToYou.toLocaleString()}
              </Text>
            </Card>

            {/* You Owe Card */}
            <Card style={[styles.bentoHalf, styles.oweCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>You Owe</Text>
                <ArrowDownLeftIcon size={18} color={Colors.error} />
              </View>
              <Text style={[styles.cardValueSmall, { color: Colors.error }]}>
                ₹{globalBalances.youOwe.toLocaleString()}
              </Text>
            </Card>

            {/* Groups Card */}
            <Card style={styles.bentoFull}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Active Groups</Text>
                <UsersIcon size={18} color={Colors.secondary} />
              </View>
              <Text style={styles.cardValueMedium}>{groups.length}</Text>
              <Text style={styles.cardSubtext}>Shared expense hubs</Text>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/(tabs)/explore')} // Redirects to explorer
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <PlusIcon size={24} color={Colors.primary} />
            </View>
            <Text style={styles.actionText}>Add Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/modal')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <UsersIcon size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.actionText}>New Group</Text>
          </TouchableOpacity>
        </View>

        {/* Active Groups List Preview */}
        <View style={styles.groupsHeader}>
          <Text style={styles.sectionTitle}>My Groups</Text>
          <TouchableOpacity onPress={() => router.push('/modal')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {groups.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No active groups found</Text>
            <Text style={styles.emptySubtext}>Create or join a group to start splitting bills</Text>
          </Card>
        ) : (
          groups.slice(0, 3).map((group) => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupItem}
              activeOpacity={0.7}
            >
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>{group.name.substring(0, 2).toUpperCase()}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupNameText}>{group.name}</Text>
                <Text style={styles.groupDescriptionText} numberOfLines={1}>
                  {group.description || 'Shared Expense OS Group'}
                </Text>
              </View>
              <ArrowUpRightIcon size={16} color={Colors.muted} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 24,
    paddingTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcome: {
    fontSize: 14,
    color: Colors.muted,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  invitationBanner: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  invitationText: {
    color: Colors.secondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  bentoFull: {
    width: '100%',
  },
  bentoHalf: {
    width: '48%',
  },
  mainCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  owedCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  oweCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardValueMedium: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 12,
    color: Colors.muted,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 28,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 12,
  },
  groupAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupAvatarText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  groupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  groupNameText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupDescriptionText: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
});
