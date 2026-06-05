import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, RefreshCw, Send, CheckCircle, Clock, XCircle, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/store/authContext';

import { Colors } from '../../../src/theme/theme';
import { balanceService } from '../../../src/services/balanceService';
import { settlementService, SettlementStatus } from '../../../src/services/settlementService';
import { createSettlementSchema, CreateSettlementFields } from '../../../src/features/settlements/schemas/settlementSchemas';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';

const ArrowLeftIcon = ArrowLeft as any;
const RefreshCwIcon = RefreshCw as any;
const SendIcon = Send as any;
const CheckIcon = Check as any;
const XIcon = X as any;

export default function SettlementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { id } = useLocalSearchParams();
  const groupId = Number(id);

  const [activeFormSuggestion, setActiveFormSuggestion] = useState<{ toUserId: number; toUserName: string; amount: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Queries
  const { 
    data: balances = [], 
    isLoading: loadingBalances, 
    refetch: refetchBalances 
  } = useQuery({
    queryKey: ['groupBalances', groupId],
    queryFn: () => balanceService.getBalances(groupId),
    enabled: !isNaN(groupId),
  });

  const { 
    data: suggestions = [], 
    isLoading: loadingSuggestions, 
    refetch: refetchSuggestions 
  } = useQuery({
    queryKey: ['groupSuggestions', groupId],
    queryFn: () => balanceService.getSettlementSuggestions(groupId),
    enabled: !isNaN(groupId),
  });

  const { 
    data: history = [], 
    isLoading: loadingHistory, 
    refetch: refetchHistory 
  } = useQuery({
    queryKey: ['groupSettlements', groupId],
    queryFn: () => settlementService.getSettlementsByGroup(groupId),
    enabled: !isNaN(groupId),
  });

  // Mutations
  const createSettlementMutation = useMutation({
    mutationFn: settlementService.createSettlement,
    onSuccess: () => {
      setSuccessMsg('Settlement request recorded successfully!');
      setActiveFormSuggestion(null);
      reset();
      
      // Invalidate queries to refresh balance data
      queryClient.invalidateQueries({ queryKey: ['groupBalances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupSuggestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupSettlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['globalBalances'] });
      
      refetchBalances();
      refetchSuggestions();
      refetchHistory();
      
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to request settlement');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  });

  const approveSettlementMutation = useMutation({
    mutationFn: settlementService.approveSettlement,
    onSuccess: () => {
      setSuccessMsg('Settlement accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['groupBalances', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupSuggestions', groupId] });
      queryClient.invalidateQueries({ queryKey: ['groupSettlements', groupId] });
      queryClient.invalidateQueries({ queryKey: ['globalBalances'] });
      refetchBalances();
      refetchSuggestions();
      refetchHistory();
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to accept settlement');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  });

  const rejectSettlementMutation = useMutation({
    mutationFn: settlementService.rejectSettlement,
    onSuccess: () => {
      setSuccessMsg('Settlement rejected successfully!');
      queryClient.invalidateQueries({ queryKey: ['groupSettlements', groupId] });
      refetchHistory();
      setTimeout(() => setSuccessMsg(null), 3000);
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || 'Failed to reject settlement');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  });

  // Forms
  const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm<CreateSettlementFields>({
    resolver: zodResolver(createSettlementSchema),
    defaultValues: {
      groupId: groupId,
      toUserId: undefined,
      amount: undefined,
      note: '',
    },
  });

  const triggerSettleForm = (toUserId: number, toUserName: string, amount: number) => {
    setActiveFormSuggestion({ toUserId, toUserName, amount });
    setValue('toUserId', toUserId);
    setValue('amount', amount);
  };

  const onSubmit = (data: CreateSettlementFields) => {
    setErrorMsg(null);
    createSettlementMutation.mutate({
      groupId,
      toUserId: data.toUserId,
      amount: data.amount,
      note: data.note,
    });
  };

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'APPROVED':
        return (
          <View style={[styles.badge, styles.badgeApproved]}>
            <CheckCircle size={10} color={Colors.primary} />
            <Text style={[styles.badgeText, { color: Colors.primary }]}>Accepted</Text>
          </View>
        );
      case 'REJECTED':
        return (
          <View style={[styles.badge, styles.badgeRejected]}>
            <XCircle size={10} color={Colors.error} />
            <Text style={[styles.badgeText, { color: Colors.error }]}>Rejected</Text>
          </View>
        );
      case 'PENDING':
      default:
        return (
          <View style={[styles.badge, styles.badgePending]}>
            <Clock size={10} color={Colors.secondary} />
            <Text style={[styles.badgeText, { color: Colors.secondary }]}>Pending</Text>
          </View>
        );
    }
  };

  const myPendingApprovals = history.filter(h => h.status === 'PENDING' && h.toUserId.toString() === user.id);
  const mySuggestions = suggestions.filter(s => s.fromUserId.toString() === user.id || s.toUserId.toString() === user.id);

  const isLoading = loadingBalances || loadingSuggestions || loadingHistory;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settlements</Text>
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={() => {
            refetchBalances();
            refetchSuggestions();
            refetchHistory();
          }}
          activeOpacity={0.7}
        >
          <RefreshCwIcon size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          {successMsg && (
            <View style={[styles.banner, styles.successBanner]}>
              <Text style={styles.bannerText}>{successMsg}</Text>
            </View>
          )}
          {errorMsg && (
            <View style={[styles.banner, styles.errorBanner]}>
              <Text style={styles.bannerText}>{errorMsg}</Text>
            </View>
          )}

          {/* Settle Mini Form */}
          {activeFormSuggestion && (
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>Record Payment to {activeFormSuggestion.toUserName}</Text>
                <TouchableOpacity onPress={() => setActiveFormSuggestion(null)}>
                  <XCircle size={20} color={Colors.muted} />
                </TouchableOpacity>
              </View>
              
              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Amount (₹)"
                    placeholder="0.00"
                    keyboardType="numeric"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? Number(text) : undefined)}
                    value={value !== undefined ? String(value) : ''}
                    error={errors.amount?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="note"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Payment Reference Note"
                    placeholder="e.g. UPI txn #123"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.note?.message}
                  />
                )}
              />

              <Button 
                title="Send Settlement Request"
                onPress={handleSubmit(onSubmit)}
                isLoading={createSettlementMutation.isPending}
                style={styles.formBtn}
              />
            </Card>
          )}



          {/* Suggestions */}
          <Text style={styles.sectionTitle}>Settlement Suggestions</Text>
          {mySuggestions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Everyone is fully settled!</Text>
            </Card>
          ) : (
            mySuggestions.map((s, index) => (
              <Card key={index} style={styles.suggestionCard}>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionText}>
                    {s.fromUserId.toString() === user.id ? (
                      <Text>You owe <Text style={styles.textBold}>{s.toUserName}</Text></Text>
                    ) : (
                      <Text><Text style={styles.textBold}>{s.fromUserName}</Text> owes You</Text>
                    )}
                  </Text>
                  <Text style={styles.suggestionAmount}>₹{s.amount.toLocaleString()}</Text>
                </View>
                {s.fromUserId.toString() === user.id && (
                  <TouchableOpacity 
                    style={styles.settleBtn}
                    onPress={() => triggerSettleForm(s.toUserId, s.toUserName, s.amount)}
                    activeOpacity={0.7}
                  >
                    <SendIcon size={14} color="#000000" />
                    <Text style={styles.settleBtnText}>Settle</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))
          )}

          {/* Pending Approvals */}
          {myPendingApprovals.length > 0 && (
            <View>
              <Text style={styles.sectionTitle}>Pending Approvals</Text>
              {myPendingApprovals.map((h) => (
                <Card key={h.id} style={styles.approvalCard}>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDesc}>
                      {h.fromUserName} Paid You
                    </Text>
                    <Text style={styles.historyNote}>
                      {h.note || 'No transaction note'}
                    </Text>
                  </View>
                  <View style={styles.approvalActions}>
                    <Text style={styles.approvalAmt}>₹{h.amount.toLocaleString()}</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.circleBtn, styles.rejectBtn]}
                        onPress={() => rejectSettlementMutation.mutate(h.id)}
                        disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <XIcon size={12} color={Colors.error} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.circleBtn, styles.acceptBtn]}
                        onPress={() => approveSettlementMutation.mutate(h.id)}
                        disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <CheckIcon size={12} color="#000000" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* History */}
          <Text style={styles.sectionTitle}>Settlement History</Text>
          {history.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>No settlements recorded yet</Text>
            </Card>
          ) : (
            history.map((h) => (
              <Card key={h.id} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDesc}>
                    {h.fromUserName} Paid {h.toUserName}
                  </Text>
                  <Text style={styles.historyNote}>
                    {h.note || 'No transaction note'}
                  </Text>
                </View>
                <View style={styles.historyValues}>
                  <Text style={styles.historyAmt}>₹{h.amount.toLocaleString()}</Text>
                  {getStatusBadge(h.status)}
                </View>
              </Card>
            ))
          )}

          <View style={{ height: 40 }} />
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
  refreshBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  banner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  successBanner: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: Colors.success,
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: Colors.error,
  },
  bannerText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 16,
  },

  emptyCard: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 14,
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 16,
  },
  suggestionText: {
    color: Colors.muted,
    fontSize: 14,
  },
  textBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  suggestionAmount: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
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
  formCard: {
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  formBtn: {
    marginTop: 8,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
  },
  historyInfo: {
    flex: 1,
    marginRight: 16,
  },
  historyDesc: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  historyNote: {
    color: Colors.muted,
    fontSize: 12,
    marginTop: 4,
  },
  historyValues: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyAmt: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeApproved: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderColor: Colors.success,
  },
  badgePending: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderColor: Colors.secondary,
  },
  badgeRejected: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderColor: Colors.error,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  approvalActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  approvalAmt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
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
});
