import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, RefreshCw, Send, CheckCircle, Clock, XCircle, Check, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/store/authContext';

import { Colors } from '../../../src/theme/theme';
import { useTheme } from '../../../src/theme/ThemeContext';
import { balanceService } from '../../../src/services/balanceService';
import { settlementService, SettlementStatus } from '../../../src/services/settlementService';
import { createSettlementSchema, CreateSettlementFields } from '../../../src/features/settlements/schemas/settlementSchemas';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';
import { Badge } from '../../../src/components/common/Badge';

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
  const { colors } = useTheme();
  const contrastIconColor = colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF';

  const [activeFormSuggestion, setActiveFormSuggestion] = useState<{ toUserId: number; toUserName: string; amount: number } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchBalances(),
      refetchSuggestions(),
      refetchHistory(),
    ]);
    setRefreshing(false);
  };

  const getStatusBadge = (status: SettlementStatus) => {
    switch (status) {
      case 'APPROVED':
        return <Badge label="Accepted" variant="success" />;
      case 'REJECTED':
        return <Badge label="Rejected" variant="danger" />;
      case 'PENDING':
      default:
        return <Badge label="Pending" variant="warning" />;
    }
  };

  const myPendingApprovals = history.filter(h => h.status === 'PENDING' && h.toUserId.toString() === user.id);
  const mySuggestions = suggestions.filter(s => s.fromUserId.toString() === user.id || s.toUserId.toString() === user.id);

  const isLoading = loadingBalances || loadingSuggestions || loadingHistory;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settlements</Text>
        <TouchableOpacity 
          style={styles.refreshBtn} 
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <RefreshCwIcon size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {isLoading && !refreshing ? (
        <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView 
          style={[styles.container, { backgroundColor: colors.background }]} 
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
          {successMsg && (
            <View style={[styles.banner, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
              <Text style={[styles.bannerText, { color: colors.primary }]}>{successMsg}</Text>
            </View>
          )}
          {errorMsg && (
            <View style={[styles.banner, { backgroundColor: colors.error + '10', borderColor: colors.error + '25' }]}>
              <Text style={[styles.bannerText, { color: colors.error }]}>{errorMsg}</Text>
            </View>
          )}

          {/* Settle Mini Form */}
          {activeFormSuggestion && (
            <Card style={styles.formCard}>
              <View style={styles.formHeader}>
                <Text style={[styles.formTitle, { color: colors.text }]}>Record Payment to {activeFormSuggestion.toUserName}</Text>
                <TouchableOpacity onPress={() => setActiveFormSuggestion(null)}>
                  <XIcon size={18} color={colors.muted} />
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
                    placeholder="e.g. Paid via UPI"
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
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Vault Suggestions</Text>
          {mySuggestions.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>Everyone is fully settled!</Text>
            </Card>
          ) : (
            mySuggestions.map((s, index) => (
              <Card key={index} style={[styles.suggestionCard, { borderLeftColor: colors.primary }]} delay={index * 50}>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionText}>
                    {s.fromUserId.toString() === user.id ? (
                      <Text style={[styles.textOwe, { color: colors.muted }]}>You owe <Text style={[styles.textBold, { color: colors.text }]}>{s.toUserName}</Text></Text>
                    ) : (
                      <Text style={[styles.textOwed, { color: colors.primary }]}><Text style={[styles.textBold, { color: colors.text }]}>{s.fromUserName}</Text> owes You</Text>
                    )}
                  </Text>
                  <Text style={[styles.suggestionAmount, { color: colors.text }]}>₹{s.amount.toLocaleString()}</Text>
                </View>
                {s.fromUserId.toString() === user.id && (
                  <TouchableOpacity 
                    style={[styles.settleBtn, { backgroundColor: colors.primary }]}
                    onPress={() => triggerSettleForm(s.toUserId, s.toUserName, s.amount)}
                    activeOpacity={0.75}
                  >
                    <SendIcon size={14} color={contrastIconColor} />
                    <Text style={[styles.settleBtnText, { color: contrastIconColor }]}>Settle</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))
          )}

          {/* Pending Approvals */}
          {myPendingApprovals.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Pending Approvals</Text>
              {myPendingApprovals.map((h, index) => (
                <Card key={h.id} style={[styles.approvalCard, { borderLeftColor: colors.primary }]} delay={index * 50}>
                  <View style={styles.historyInfo}>
                    <Text style={[styles.historyDesc, { color: colors.text }]}>
                      {h.fromUserName} Paid You
                    </Text>
                    <Text style={[styles.historyNote, { color: colors.muted }]}>
                      {h.note || 'No transaction note'}
                    </Text>
                  </View>
                  <View style={styles.approvalActions}>
                    <Text style={[styles.approvalAmt, { color: colors.text }]}>₹{h.amount.toLocaleString()}</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={[styles.circleBtn, styles.rejectBtn, { borderColor: colors.border }]}
                        onPress={() => rejectSettlementMutation.mutate(h.id)}
                        disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <XIcon size={12} color={colors.error} />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.circleBtn, styles.acceptBtn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => approveSettlementMutation.mutate(h.id)}
                        disabled={rejectSettlementMutation.isPending || approveSettlementMutation.isPending}
                        activeOpacity={0.7}
                      >
                        <CheckIcon size={12} color={contrastIconColor} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* History */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Settlement History</Text>
          {history.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.muted }]}>No settlements recorded yet</Text>
            </Card>
          ) : (
            history.map((h, index) => (
              <Card key={h.id} style={styles.historyCard} delay={index * 40}>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyDesc, { color: colors.text }]}>
                    {h.fromUserName} Paid {h.toUserName}
                  </Text>
                  <Text style={[styles.historyNote, { color: colors.muted }]}>
                    {h.note || 'No transaction note'}
                  </Text>
                </View>
                <View style={styles.historyValues}>
                  <Text style={[styles.historyAmt, { color: colors.primary }]}>₹{h.amount.toLocaleString()}</Text>
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
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
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
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  successBanner: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: 'rgba(215, 255, 63, 0.15)',
  },
  errorBanner: {
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
    borderColor: 'rgba(255, 107, 107, 0.15)',
  },
  bannerText: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  emptyCard: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  suggestionInfo: {
    flex: 1,
    marginRight: 16,
  },
  suggestionText: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  textOwe: {
    color: Colors.muted,
  },
  textOwed: {
    color: Colors.primary,
  },
  textBold: {
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  suggestionAmount: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    marginTop: 4,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  settleBtnText: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  formCard: {
    marginBottom: 24,
    padding: 18,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  historyNote: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  historyValues: {
    alignItems: 'flex-end',
    gap: 6,
  },
  historyAmt: {
    color: Colors.primary,
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  approvalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  approvalActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  approvalAmt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  circleBtn: {
    width: 28,
    height: 28,
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
});
