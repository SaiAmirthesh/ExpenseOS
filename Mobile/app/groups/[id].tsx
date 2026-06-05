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
import { ArrowLeft, UserPlus, Trash, Shield, Plus, DollarSign, Wallet, LogOut } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { groupService } from '../../src/services/groupService';
import { invitationService } from '../../src/services/invitationService';
import { expenseService } from '../../src/services/expenseService';
import { inviteMemberSchema, InviteMemberFields } from '../../src/features/groups/schemas/groupSchemas';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { Card } from '../../src/components/common/Card';

const ArrowLeftIcon = ArrowLeft as any;
const UserPlusIcon = UserPlus as any;
const TrashIcon = Trash as any;
const ShieldIcon = Shield as any;
const PlusIcon = Plus as any;
const DollarSignIcon = DollarSign as any;
const WalletIcon = Wallet as any;
const LogOutIcon = LogOut as any;

export default function GroupDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const groupId = Number(id);

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
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid Group ID</Text>
        <Button title="Go Back" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {group?.name || 'Group Details'}
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
              <ActivityIndicator size="small" color={Colors.error} />
            ) : (
              <TrashIcon size={20} color={Colors.error} />
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
              <ActivityIndicator size="small" color={Colors.warning} />
            ) : (
              <LogOutIcon size={20} color={Colors.warning} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView 
            style={styles.container} 
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          >
            {/* Metadata info */}
            <Card style={styles.metaCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.groupTitle}>{group?.name}</Text>
                  <Text style={styles.groupDesc}>{group?.description || 'No description provided'}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.settlementsNavBtn}
                  onPress={() => router.push(`/groups/${groupId}/settlements`)}
                  activeOpacity={0.7}
                >
                  <WalletIcon size={14} color="#000000" />
                  <Text style={styles.settlementsNavBtnText}>Settlements</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ownerBadge}>
                <ShieldIcon size={12} color={Colors.secondary} />
                <Text style={styles.ownerText}>Owner: {group?.createdBy}</Text>
              </View>
            </Card>

            {/* Segment Tab Controls */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'EXPENSES' && styles.tabButtonActive]}
                onPress={() => setActiveTab('EXPENSES')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'EXPENSES' && styles.tabTextActive]}>
                  Expenses
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'MEMBERS' && styles.tabButtonActive]}
                onPress={() => setActiveTab('MEMBERS')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabText, activeTab === 'MEMBERS' && styles.tabTextActive]}>
                  Members ({members.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Render Tab Contents */}
            {activeTab === 'EXPENSES' ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Group Bills</Text>
                  <TouchableOpacity 
                    style={styles.inlineAddBtn}
                    onPress={() => router.push(`/groups/${groupId}/create-expense`)}
                    activeOpacity={0.7}
                  >
                    <PlusIcon size={16} color="#000000" />
                    <Text style={styles.inlineAddBtnText}>Add Bill</Text>
                  </TouchableOpacity>
                </View>

                {expenses.length === 0 ? (
                  <Card style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No bills recorded yet</Text>
                    <Text style={styles.emptySubtext}>Split your first bill by tapping the "Add Bill" button above.</Text>
                  </Card>
                ) : (
                  expenses.map((expense) => (
                    <Card key={expense.id} style={styles.expenseCard}>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseTitle}>{expense.title}</Text>
                        <Text style={styles.expenseMeta}>
                          Paid by {expense.paidByName} • {expense.category}
                        </Text>
                      </View>
                      <View style={styles.expenseValueWrap}>
                        <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString()}</Text>
                        <Text style={styles.expenseSplitType}>{expense.splitType} SPLIT</Text>
                      </View>
                    </Card>
                  ))
                )}
              </View>
            ) : (
              <View>
                {/* Invite Member Section */}
                <Text style={styles.sectionTitle}>Invite Member</Text>
                <Card style={styles.formCard}>
                  {inviteError && (
                    <View style={[styles.banner, styles.errorBanner]}>
                      <Text style={styles.errorText}>{inviteError}</Text>
                    </View>
                  )}
                  {inviteSuccess && (
                    <View style={[styles.banner, styles.successBanner]}>
                      <Text style={styles.successText}>{inviteSuccess}</Text>
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
                      style={styles.inviteSubmitBtn}
                      onPress={handleSubmit(onInvite)}
                      disabled={inviteMutation.isPending}
                      activeOpacity={0.7}
                    >
                      {inviteMutation.isPending ? (
                        <ActivityIndicator color="#000000" size="small" />
                      ) : (
                        <UserPlusIcon size={20} color="#000000" />
                      )}
                    </TouchableOpacity>
                  </View>
                </Card>

                {/* Members List */}
                <Text style={styles.sectionTitle}>Active Members</Text>
                {members.map((member) => (
                  <Card key={member.id} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {member.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <Text style={styles.memberEmail}>{member.email}</Text>
                    </View>
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
                      <XIcon size={16} color={Colors.muted} />
                    </TouchableOpacity>
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

// X icon proxy for internal use
const XIcon = ({ size, color }: { size: number; color: string }) => {
  const Icon = require('lucide-react-native').X as any;
  return <Icon size={size} color={color} />;
};

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
    fontSize: 20,
    fontWeight: 'bold',
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
    borderLeftColor: Colors.secondary,
    marginBottom: 20,
  },
  settlementsNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  settlementsNavBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  groupTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  groupDesc: {
    fontSize: 14,
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
    color: Colors.secondary,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    color: Colors.muted,
    fontSize: 13,
    fontWeight: 'bold',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inlineAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  inlineAddBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000000',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: Colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
  },
  expenseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
    marginRight: 16,
  },
  expenseTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseMeta: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  expenseValueWrap: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseSplitType: {
    fontSize: 9,
    color: Colors.muted,
    fontWeight: '900',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  formCard: {
    padding: 16,
    marginBottom: 24,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: Colors.error,
  },
  successBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: Colors.success,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  successText: {
    color: Colors.success,
    fontSize: 14,
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
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  memberAvatarText: {
    color: Colors.secondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    color: Colors.muted,
    fontSize: 12,
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
});
