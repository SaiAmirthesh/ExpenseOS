import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, X, Check, Mail, DollarSign, Send } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../src/theme/theme';
import { useAuth } from '../src/store/authContext';
import { groupService } from '../src/services/groupService';
import { balanceService } from '../src/services/balanceService';
import { invitationService } from '../src/services/invitationService';
import { settlementService } from '../src/services/settlementService';
import { Card } from '../src/components/common/Card';
import { Button } from '../src/components/common/Button';

const ArrowLeftIcon = ArrowLeft as any;
const BellIcon = Bell as any;
const XIcon = X as any;
const CheckIcon = Check as any;
const MailIcon = Mail as any;
const DollarSignIcon = DollarSign as any;
const SendIcon = Send as any;

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [feedbackSuccess, setFeedbackSuccess] = React.useState<string | null>(null);
  const [feedbackError, setFeedbackError] = React.useState<string | null>(null);

  // Queries
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

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.listGroups,
  });

  const {
    data: suggestions = [],
    isLoading: loadingSuggestions,
    refetch: refetchSuggestions
  } = useQuery({
    queryKey: ['notificationsSuggestions', groups.map(g => g.id)],
    enabled: groups.length > 0,
    queryFn: async () => {
      const suggestionPromises = groups.map(group =>
        balanceService.getSettlementSuggestions(group.id)
          .then(sugs => sugs.map(s => ({ ...s, groupId: group.id, groupName: group.name })))
          .catch(() => [])
      );
      const allSuggestions = await Promise.all(suggestionPromises);
      const flatSuggestions = allSuggestions.flat();
      return flatSuggestions.filter(s => s.fromUserId.toString() === user.id);
    }
  });

  // Invitation Mutations
  const acceptInviteMutation = useMutation({
    mutationFn: invitationService.acceptInvitation,
    onSuccess: (res) => {
      setFeedbackSuccess(`Accepted invitation to group "${res.groupName}"!`);
      setTimeout(() => setFeedbackSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      refetchInvitations();
    },
    onError: (err: any) => {
      setFeedbackError(err.response?.data?.message || 'Failed to accept invitation');
      setTimeout(() => setFeedbackError(null), 3000);
    }
  });

  const rejectInviteMutation = useMutation({
    mutationFn: invitationService.rejectInvitation,
    onSuccess: () => {
      setFeedbackSuccess('Invitation declined.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['pendingInvitations'] });
      refetchInvitations();
    },
    onError: (err: any) => {
      setFeedbackError(err.response?.data?.message || 'Failed to decline invitation');
      setTimeout(() => setFeedbackError(null), 3000);
    }
  });

  // Settlement Mutations
  const approveSettlementMutation = useMutation({
    mutationFn: settlementService.approveSettlement,
    onSuccess: () => {
      setFeedbackSuccess('Settlement accepted successfully!');
      setTimeout(() => setFeedbackSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['pendingSettlements'] });
      queryClient.invalidateQueries({ queryKey: ['groupBalances'] });
      queryClient.invalidateQueries({ queryKey: ['groupSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['groupSettlements'] });
      queryClient.invalidateQueries({ queryKey: ['globalBalances'] });
      refetchSettlements();
      refetchSuggestions();
    },
    onError: (err: any) => {
      setFeedbackError(err.response?.data?.message || 'Failed to accept settlement');
      setTimeout(() => setFeedbackError(null), 3000);
    }
  });

  const rejectSettlementMutation = useMutation({
    mutationFn: settlementService.rejectSettlement,
    onSuccess: () => {
      setFeedbackSuccess('Settlement rejected.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['pendingSettlements'] });
      queryClient.invalidateQueries({ queryKey: ['groupSettlements'] });
      refetchSettlements();
      refetchSuggestions();
    },
    onError: (err: any) => {
      setFeedbackError(err.response?.data?.message || 'Failed to reject settlement');
      setTimeout(() => setFeedbackError(null), 3000);
    }
  });

  const createSettlementMutation = useMutation({
    mutationFn: settlementService.createSettlement,
    onSuccess: () => {
      setFeedbackSuccess('Payment request recorded! Awaiting receiver approval.');
      setTimeout(() => setFeedbackSuccess(null), 3000);
      queryClient.invalidateQueries({ queryKey: ['groupBalances'] });
      queryClient.invalidateQueries({ queryKey: ['groupSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['groupSettlements'] });
      queryClient.invalidateQueries({ queryKey: ['globalBalances'] });
      refetchSuggestions();
    },
    onError: (err: any) => {
      setFeedbackError(err.response?.data?.message || 'Failed to record settlement');
      setTimeout(() => setFeedbackError(null), 3000);
    }
  });

  const handleQuickSettle = (groupId: number, toUserId: number, amount: number) => {
    createSettlementMutation.mutate({
      groupId,
      toUserId,
      amount,
      note: 'Quick settled from Notifications',
    });
  };

  const isLoading = loadingInvitations || loadingSettlements || loadingSuggestions;
  const totalCount = pendingInvitations.length + pendingSettlements.length + suggestions.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.badgeWrapper}>
          {totalCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{totalCount}</Text>
            </View>
          )}
        </View>
      </View>

      {feedbackSuccess && (
        <View style={[styles.feedbackBanner, styles.successBanner]}>
          <Text style={styles.successBannerText}>{feedbackSuccess}</Text>
        </View>
      )}

      {feedbackError && (
        <View style={[styles.feedbackBanner, styles.errorBanner]}>
          <Text style={styles.errorBannerText}>{feedbackError}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {/* Group Invites Section */}
          <View style={styles.sectionHeader}>
            <MailIcon size={16} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Group Invites ({pendingInvitations.length})</Text>
          </View>
          
          {pendingInvitations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending group invites</Text>
            </Card>
          ) : (
            pendingInvitations.map((invite) => (
              <Card key={invite.id} style={styles.notificationCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{invite.groupName}</Text>
                  <Text style={styles.cardSub}>Invited by: {invite.invitedBy}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.rejectBtn]}
                    onPress={() => rejectInviteMutation.mutate(invite.id)}
                    disabled={rejectInviteMutation.isPending || acceptInviteMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <XIcon size={16} color={Colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.acceptBtn]}
                    onPress={() => acceptInviteMutation.mutate(invite.id)}
                    disabled={rejectInviteMutation.isPending || acceptInviteMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <CheckIcon size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          {/* Settlement Suggestions Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <DollarSignIcon size={16} color={Colors.secondary} />
            <Text style={styles.sectionTitle}>Suggested Payments ({suggestions.length})</Text>
          </View>

          {suggestions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>You do not owe anyone money!</Text>
            </Card>
          ) : (
            suggestions.map((s, index) => (
              <Card key={index} style={styles.notificationCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>₹{s.amount.toLocaleString()}</Text>
                  <Text style={styles.cardSub}>
                    Pay <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>{s.toUserName}</Text> in {s.groupName}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={styles.settleBtn}
                  onPress={() => handleQuickSettle(s.groupId, s.toUserId, s.amount)}
                  disabled={createSettlementMutation.isPending}
                  activeOpacity={0.7}
                >
                  {createSettlementMutation.isPending ? (
                    <ActivityIndicator size="small" color="#000000" />
                  ) : (
                    <>
                      <SendIcon size={14} color="#000000" />
                      <Text style={styles.settleBtnText}>Settle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Card>
            ))
          )}

          {/* Settlement Requests Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <DollarSignIcon size={16} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Settlement Approvals ({pendingSettlements.length})</Text>
          </View>

          {pendingSettlements.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No pending settlement approvals</Text>
            </Card>
          ) : (
            pendingSettlements.map((settlement) => (
              <Card key={settlement.id} style={styles.notificationCard}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>₹{settlement.amount.toLocaleString()}</Text>
                  <Text style={styles.cardSub}>
                    From: {settlement.fromUserName} for {settlement.groupName}
                  </Text>
                  {settlement.note && (
                    <Text style={styles.cardNote}>
                      "{settlement.note}"
                    </Text>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.rejectBtn]}
                    onPress={() => rejectSettlementMutation.mutate(settlement.id)}
                    disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <XIcon size={16} color={Colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.acceptBtn]}
                    onPress={() => approveSettlementMutation.mutate(settlement.id)}
                    disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <CheckIcon size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}
        </ScrollView>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgeWrapper: {
    width: 32,
    alignItems: 'flex-end',
  },
  headerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  headerBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontWeight: 'bold',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  cardInfo: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSub: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  cardNote: {
    color: Colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  rejectBtn: {
    backgroundColor: 'transparent',
    borderColor: Colors.border,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  settleBtnText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: 'bold',
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 16,
  },
  successBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: Colors.success,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: Colors.error,
  },
  successBannerText: {
    color: Colors.success,
    fontSize: 14,
    textAlign: 'center',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
});
