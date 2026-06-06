import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  ArrowLeft, 
  UserPlus, 
  Trash, 
  Shield, 
  Plus, 
  Wallet, 
  LogOut,
  Utensils,
  Plane,
  ShoppingCart,
  Home,
  Gamepad2,
  Lightbulb,
  HeartPulse,
  Package,
  X
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { groupService } from '../../src/services/groupService';
import { invitationService } from '../../src/services/invitationService';
import { expenseService } from '../../src/services/expenseService';
import { inviteMemberSchema, InviteMemberFields } from '../../src/features/groups/schemas/groupSchemas';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';
import { Avatar } from '../../src/components/common/Avatar';
import { ExpenseCard } from '../../src/components/common/ExpenseCard';
import { Badge } from '../../src/components/common/Badge';

const ArrowLeftIcon = ArrowLeft as any;
const UserPlusIcon = UserPlus as any;
const TrashIcon = Trash as any;
const ShieldIcon = Shield as any;
const PlusIcon = Plus as any;
const WalletIcon = Wallet as any;
const LogOutIcon = LogOut as any;
const XIcon = X as any;

const CATEGORY_ICON_MAP: Record<string, any> = {
  FOOD: Utensils,
  TRAVEL: Plane,
  SHOPPING: ShoppingCart,
  RENT: Home,
  ENTERTAINMENT: Gamepad2,
  UTILITIES: Lightbulb,
  HEALTH: HeartPulse,
  OTHER: Package,
};

const CATEGORY_COLORS: Record<string, string> = {
  FOOD: '#FF6B6B',
  TRAVEL: '#D7FF3F',
  SHOPPING: '#FFE66D',
  RENT: '#A855F7',
  ENTERTAINMENT: '#4ECDC4',
  UTILITIES: '#FF9500',
  HEALTH: '#FF6B6B',
  OTHER: '#B4BCD0',
};

export default function GroupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const groupId = Number(id);
  const { colors } = useTheme();
  const contrastIconColor = colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF';

  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'MEMBERS'>('EXPENSES');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  // Queries
  const { data: group, isLoading: loadingGroup, refetch: refetchGroup } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => groupService.getGroupById(groupId),
    enabled: !isNaN(groupId),
  });

  const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupService.getMembers(groupId),
    enabled: !isNaN(groupId),
  });

  const { data: expenses = [], isLoading: loadingExpenses, refetch: refetchExpenses } = useQuery({
    queryKey: ['groupExpenses', groupId],
    queryFn: () => expenseService.getExpensesByGroup(groupId),
    enabled: !isNaN(groupId),
  });

  // Mutations
  const inviteMutation = useMutation({
    mutationFn: (email: string) => invitationService.inviteUser(groupId, { email }),
    onSuccess: (res) => {
      setInviteSuccess(`Invitation sent to ${res.invitedUser}!`);
      reset();
      setTimeout(() => setInviteSuccess(null), 3000);
    },
    onError: (err: any) => {
      setInviteError(err.response?.data?.message || 'Failed to send invitation');
      setTimeout(() => setInviteError(null), 3000);
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: () => groupService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert(
        'Cannot Delete Group',
        err.response?.data?.message || 'Failed to delete group. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: () => groupService.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      router.back();
    },
    onError: (err: any) => {
      Alert.alert(
        'Cannot Leave Group',
        err.response?.data?.message || 'Failed to leave the group. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => groupService.removeMember(groupId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] });
      refetchMembers();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to remove member.');
    },
  });

  // Forms
  const { control, handleSubmit, reset, formState: { errors } } = useForm<InviteMemberFields>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
    },
  });

  const onInvite = (data: InviteMemberFields) => {
    setInviteError(null);
    setInviteSuccess(null);
    inviteMutation.mutate(data.email);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchGroup(),
      refetchMembers(),
      refetchExpenses(),
    ]);
    setRefreshing(false);
  };

  const isLoading = loadingGroup || loadingMembers || loadingExpenses;

  if (isNaN(groupId)) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>Invalid Group ID</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {group?.name || 'Group Vault'}
        </Text>
        {/* Only show delete button to the group creator */}
        {group?.createdBy === user.email && (
          <TouchableOpacity 
            style={styles.deleteGroupBtn} 
            onPress={() => {
              Alert.alert(
                'Delete Group',
                'Are you sure you want to delete this group? All expenses and records will be permanently lost.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteGroupMutation.mutate(),
                  },
                ]
              );
            }}
            disabled={deleteGroupMutation.isPending}
            activeOpacity={0.7}
          >
            {deleteGroupMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <TrashIcon size={20} color={colors.error} />
            )}
          </TouchableOpacity>
        )}
        {/* Show Leave button only to non-owner members */}
        {group?.createdBy !== user.email && (
          <TouchableOpacity
            style={styles.deleteGroupBtn}
            onPress={() => {
              Alert.alert(
                'Leave Group',
                'You can only leave if your balance is settled (₹0 owed / ₹0 to receive). Continue?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: () => leaveGroupMutation.mutate(),
                  },
                ]
              );
            }}
            disabled={leaveGroupMutation.isPending}
            activeOpacity={0.7}
          >
            {leaveGroupMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.warning} />
            ) : (
              <LogOutIcon size={20} color={colors.warning} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing ? (
        <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.content}
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
            {/* Metadata info */}
            <Card style={[styles.metaCard, { borderLeftColor: colors.primary }]} delay={50}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={[styles.groupTitle, { color: colors.text }]}>{group?.name}</Text>
                  <Text style={[styles.groupDesc, { color: colors.muted }]}>{group?.description || 'No description provided'}</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.settlementsNavBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/groups/${groupId}/settlements`)}
                  activeOpacity={0.75}
                >
                  <WalletIcon size={14} color={contrastIconColor} />
                  <Text style={[styles.settlementsNavBtnText, { color: contrastIconColor }]}>Settle Up</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ownerBadge}>
                <ShieldIcon size={12} color={colors.primary} />
                <Text style={[styles.ownerText, { color: colors.primary }]}>Owner: {group?.createdBy}</Text>
              </View>
            </Card>

            {/* Segment Tab Controls */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'EXPENSES' && [styles.tabButtonActive, { backgroundColor: colors.card, borderColor: colors.border }]]}
                onPress={() => setActiveTab('EXPENSES')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'EXPENSES' && { color: colors.primary }]}>
                  Bills & Expenses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'MEMBERS' && [styles.tabButtonActive, { backgroundColor: colors.card, borderColor: colors.border }]]}
                onPress={() => setActiveTab('MEMBERS')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, { color: colors.muted }, activeTab === 'MEMBERS' && { color: colors.primary }]}>
                  Members ({members.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Render Tab Contents */}
            {activeTab === 'EXPENSES' ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Shared Ledger</Text>
                  <TouchableOpacity 
                    style={[styles.inlineAddBtn, { backgroundColor: colors.primary }]}
                    onPress={() => router.push(`/groups/${groupId}/create-expense`)}
                    activeOpacity={0.75}
                  >
                    <PlusIcon size={16} color={contrastIconColor} />
                    <Text style={[styles.inlineAddBtnText, { color: contrastIconColor }]}>Add Bill</Text>
                  </TouchableOpacity>
                </View>

                {expenses.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={[styles.emptyText, { color: colors.text }]}>No bills recorded yet</Text>
                    <Text style={[styles.emptySubtext, { color: colors.muted }]}>Split your first bill by tapping the "Add Bill" button above.</Text>
                  </Card>
                ) : (
                  expenses.map((expense, idx) => {
                    const cat = expense.category || 'OTHER';
                    const color = CATEGORY_COLORS[cat] || colors.primary;
                    const CatIcon = CATEGORY_ICON_MAP[cat] || Package;
                    return (
                      <ExpenseCard
                        key={expense.id}
                        title={expense.title}
                        amount={expense.amount}
                        category={cat}
                        categoryColor={color}
                        categoryIcon={<CatIcon size={18} color={color} />}
                        paidByText={`Paid by ${expense.paidByName}`}
                        splitText={`${expense.splitType} SPLIT`}
                        delay={100 + idx * 40}
                      />
                    );
                  })
                )}
              </View>
            ) : (
              <View>
                {/* Invite Member Section */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Invite Member</Text>
                <Card style={styles.formCard}>
                  {inviteError && (
                    <View style={[styles.banner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
                      <Text style={[styles.errorBannerText, { color: colors.error }]}>{inviteError}</Text>
                    </View>
                  )}
                  {inviteSuccess && (
                    <View style={[styles.banner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
                      <Text style={[styles.successBannerText, { color: colors.primary }]}>{inviteSuccess}</Text>
                    </View>
                  )}
                  
                  <View style={styles.inviteFormRow}>
                    <View style={{ flex: 1 }}>
                      <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, onBlur, value } }) => (
                          <Input
                            placeholder="email@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            onBlur={onBlur}
                            onChangeText={onChange}
                            value={value}
                            error={errors.email?.message}
                            style={styles.inputSpacingOverride}
                          />
                        )}
                      />
                    </View>
                    <TouchableOpacity 
                      style={[styles.inviteSubmitBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSubmit(onInvite)}
                      disabled={inviteMutation.isPending}
                      activeOpacity={0.7}
                    >
                      {inviteMutation.isPending ? (
                        <ActivityIndicator color={contrastIconColor} size="small" />
                      ) : (
                        <UserPlusIcon size={20} color={contrastIconColor} />
                      )}
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* Members List */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Members</Text>
                {members.map((member) => (
                  <Card key={member.id} style={styles.memberCard}>
                    <Avatar name={member.name} size={36} style={styles.memberAvatar} />
                    <View style={styles.memberInfo}>
                      <Text style={[styles.memberName, { color: colors.text }]}>{member.name}</Text>
                      <Text style={[styles.memberEmail, { color: colors.muted }]}>{member.email}</Text>
                    </View>
                    {group?.createdBy === user.email && member.email !== user.email && (
                      <TouchableOpacity 
                        onPress={() => {
                          Alert.alert(
                            'Remove Member',
                            `Remove ${member.name} from this group?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Remove',
                                style: 'destructive',
                                onPress: () => removeMemberMutation.mutate(member.id),
                              },
                            ]
                          );
                        }}
                        disabled={removeMemberMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <XIcon size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </Card>
                ))}
              </View>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  deleteGroupBtn: {
    padding: 6,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  metaCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 20,
  },
  settlementsNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  settlementsNavBtnText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000000',
  },
  groupTitle: {
    fontSize: 22,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  groupDesc: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
  },
  ownerText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  tabTextActive: {
    color: Colors.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 4,
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  inlineAddBtnText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#000000',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    marginTop: 6,
    paddingHorizontal: 16,
  },
  formCard: {
    padding: 16,
    marginBottom: 20,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  successBanner: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: 'rgba(215, 255, 63, 0.15)',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  successBannerText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  inviteFormRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  inputSpacingOverride: {
    marginBottom: 0,
  },
  inviteSubmitBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
    borderRadius: 16,
  },
  memberAvatar: {
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  memberEmail: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 2,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.background,
    gap: 16,
  },
  errorText: {
    color: Colors.error,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});
