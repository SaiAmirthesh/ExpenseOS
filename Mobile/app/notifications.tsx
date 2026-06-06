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
import { useTheme } from '../src/theme/ThemeContext';
import { groupService } from '../src/services/groupService';
import { balanceService } from '../src/services/balanceService';
import { invitationService } from '../src/services/invitationService';
import { settlementService } from '../src/services/settlementService';
import { Card } from '../src/components/common/Card';
import { Button } from '../src/components/common/Button';
import { Badge } from '../src/components/common/Badge';

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
  const { colors } = useTheme();
  const contrastIconColor = colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        <View style={styles.badgeWrapper}>
          {totalCount > 0 && (
            <View style={[styles.headerBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.headerBadgeText, { color: contrastIconColor }]}>{totalCount}</Text>
            </View>
          )}
        </View>
      </View>

      {feedbackSuccess && (
        <View style={[styles.feedbackBanner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
          <Text style={[styles.successBannerText, { color: colors.primary }]}>{feedbackSuccess}</Text>
        </View>
      )}

      {feedbackError && (
        <View style={[styles.feedbackBanner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
          <Text style={[styles.errorBannerText, { color: colors.error }]}>{feedbackError}</Text>
        </View>
      )}

      {isLoading ? (
        <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Invites Section */}
          <View style={styles.sectionHeader}>
            <MailIcon size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Group Invites ({pendingInvitations.length})</Text>
          </View>
          
          {pendingInvitations.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No pending group invites</Text>
            </Card>
          ) : (
            pendingInvitations.map((invite) => (
              <Card key={invite.id} style={[styles.notificationCard, { borderLeftColor: colors.primary }]}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{invite.groupName}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>Invited by: {invite.invitedBy}</Text>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.rejectBtn, { borderColor: colors.border }]}
                    onPress={() => rejectInviteMutation.mutate(invite.id)}
                    disabled={rejectInviteMutation.isPending || acceptInviteMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <XIcon size={16} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.acceptBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => acceptInviteMutation.mutate(invite.id)}
                    disabled={rejectInviteMutation.isPending || acceptInviteMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <CheckIcon size={16} color={contrastIconColor} />
                  </TouchableOpacity>
                </View>
              </Card>
            ))
          )}

          {/* Settlement Suggestions Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <DollarSignIcon size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Suggested Payments ({suggestions.length})</Text>
          </View>

          {suggestions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>You do not owe anyone money!</Text>
            </Card>
          ) : (
            suggestions.map((s, index) => (
              <Card key={index} style={[styles.notificationCard, { borderLeftColor: colors.primary }]}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>₹{s.amount.toLocaleString()}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    Pay <Text style={{ color: colors.text, fontWeight: 'bold' }}>{s.toUserName}</Text> in {s.groupName}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleQuickSettle(s.groupId, s.toUserId, s.amount)}
                  disabled={createSettlementMutation.isPending}
                  activeOpacity={0.75}
                >
                  {createSettlementMutation.isPending ? (
                    <ActivityIndicator size="small" color={contrastIconColor} />
                  ) : (
                    <>
                      <SendIcon size={14} color={contrastIconColor} />
                      <Text style={[styles.settleBtnText, { color: contrastIconColor }]}>Settle</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Card>
            ))
          )}

          {/* Settlement Requests Section */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <DollarSignIcon size={16} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Settlement Approvals ({pendingSettlements.length})</Text>
          </View>

          {pendingSettlements.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No pending settlement approvals</Text>
            </Card>
          ) : (
            pendingSettlements.map((settlement) => (
              <Card key={settlement.id} style={[styles.notificationCard, { borderLeftColor: colors.primary }]}>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>₹{settlement.amount.toLocaleString()}</Text>
                  <Text style={[styles.cardSub, { color: colors.muted }]}>
                    From: {settlement.fromUserName} for {settlement.groupName}
                  </Text>
                  {settlement.note && (
                    <Text style={[styles.cardNote, { color: colors.muted }]}>
                      "{settlement.note}"
                    </Text>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.rejectBtn, { borderColor: colors.border }]}
                    onPress={() => rejectSettlementMutation.mutate(settlement.id)}
                    disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <XIcon size={16} color={colors.error} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.circleBtn, styles.acceptBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                    onPress={() => approveSettlementMutation.mutate(settlement.id)}
                    disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                    activeOpacity={0.7}
                  >
                    <CheckIcon size={16} color={contrastIconColor} />
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
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
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
    borderRadius: 8,
  },
  headerBadgeText: {
    color: '#000000',
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  cardInfo: {
    flex: 1,
    marginRight: 16,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cardSub: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  cardNote: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
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
    borderRadius: 10,
  },
  settleBtnText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  feedbackBanner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginTop: 16,
  },
  successBanner: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: 'rgba(215, 255, 63, 0.15)',
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  successBannerText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});
