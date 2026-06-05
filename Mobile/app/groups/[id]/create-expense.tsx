import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  SafeAreaView 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Check, AlertCircle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../../src/theme/theme';
import { groupService } from '../../../src/services/groupService';
import { expenseService } from '../../../src/services/expenseService';
import { createExpenseSchema, CreateExpenseFields, ExpenseCategoryType, SplitTypeType } from '../../../src/features/expenses/schemas/expenseSchemas';
import { Input } from '../../../src/components/common/Input';
import { Button } from '../../../src/components/common/Button';
import { Card } from '../../../src/components/common/Card';

const ArrowLeftIcon = ArrowLeft as any;
const AlertCircleIcon = AlertCircle as any;

const CATEGORIES: ExpenseCategoryType[] = [
  'FOOD', 'TRAVEL', 'SHOPPING', 'RENT', 'ENTERTAINMENT', 'UTILITIES', 'HEALTH', 'OTHER'
];

export default function CreateExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams();
  const groupId = Number(id);

  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategoryType>('FOOD');
  const [selectedSplitType, setSelectedSplitType] = useState<SplitTypeType>('EQUAL');
  const [memberInputs, setMemberInputs] = useState<Record<number, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);

  // Queries
  const { data: members = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => groupService.getMembers(groupId),
    enabled: !isNaN(groupId),
  });

  // Forms
  const { control, handleSubmit, watch, formState: { errors } } = useForm<CreateExpenseFields>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      groupId: groupId,
      title: '',
      description: '',
      amount: undefined,
      category: 'FOOD',
      splitType: 'EQUAL',
    },
  });

  const watchAmount = watch('amount');

  // Sync split splits inputs when members or splitType changes
  useEffect(() => {
    if (members.length > 0) {
      const initial: Record<number, string> = {};
      members.forEach(m => {
        initial[m.id] = '';
      });
      setMemberInputs(initial);
      setValidationError(null);
    }
  }, [members, selectedSplitType]);

  // Mutations
  const createExpenseMutation = useMutation({
    mutationFn: expenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupExpenses', groupId] });
      queryClient.invalidateQueries({ queryKey: ['globalBalances'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      router.back();
    },
    onError: (err: any) => {
      setValidationError(err.response?.data?.message || 'Failed to record expense');
    }
  });

  const handleMemberInputChange = (memberId: number, text: string) => {
    setMemberInputs(prev => ({
      ...prev,
      [memberId]: text,
    }));
    setValidationError(null);
  };

  const onSubmit = (data: CreateExpenseFields) => {
    setValidationError(null);
    const totalAmount = Number(data.amount);

    if (selectedSplitType === 'EQUAL') {
      createExpenseMutation.mutate({
        groupId,
        title: data.title,
        description: data.description,
        amount: totalAmount,
        category: selectedCategory,
        splitType: 'EQUAL',
      });
    } else if (selectedSplitType === 'EXACT') {
      let sum = 0;
      const splits = members.map(m => {
        const value = Number(memberInputs[m.id] || 0);
        sum += value;
        return {
          userId: m.id,
          amount: value,
        };
      });

      // Simple precision check (0.01 tolerance)
      if (Math.abs(sum - totalAmount) > 0.02) {
        setValidationError(`Sum of exact splits (₹${sum}) must equal the total amount (₹${totalAmount})`);
        return;
      }

      createExpenseMutation.mutate({
        groupId,
        title: data.title,
        description: data.description,
        amount: totalAmount,
        category: selectedCategory,
        splitType: 'EXACT',
        splits,
      });
    } else if (selectedSplitType === 'PERCENTAGE') {
      let sumPercentage = 0;
      const splits = members.map(m => {
        const pct = Number(memberInputs[m.id] || 0);
        sumPercentage += pct;
        // Calculate amount for DTO validation
        const amt = (pct / 100) * totalAmount;
        return {
          userId: m.id,
          amount: Number(amt.toFixed(2)),
          percentage: pct,
        };
      });

      if (Math.abs(sumPercentage - 100) > 0.1) {
        setValidationError(`Sum of percentages (${sumPercentage}%) must equal 100%`);
        return;
      }

      createExpenseMutation.mutate({
        groupId,
        title: data.title,
        description: data.description,
        amount: totalAmount,
        category: selectedCategory,
        splitType: 'PERCENTAGE',
        splits,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <ArrowLeftIcon size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Expense</Text>
          <View style={{ width: 32 }} />
        </View>

        {loadingMembers ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            
            {validationError && (
              <View style={styles.errorBanner}>
                <AlertCircleIcon size={18} color={Colors.error} />
                <Text style={styles.errorText}>{validationError}</Text>
              </View>
            )}

            {/* General Info Card */}
            <Card>
              <Controller
                control={control}
                name="title"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Expense Title"
                    placeholder="e.g. Dinner, Taxi, Airbnb"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.title?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Total Amount (₹)"
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
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Description (Optional)"
                    placeholder="Brief details"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.description?.message}
                  />
                )}
              />
            </Card>

            {/* Category Selector Grid */}
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat && styles.categoryItemActive,
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextActive,
                  ]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Split Schema Selector */}
            <Text style={styles.sectionTitle}>Split Schema</Text>
            <View style={styles.splitSegmentContainer}>
              {(['EQUAL', 'EXACT', 'PERCENTAGE'] as SplitTypeType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.splitSegmentButton,
                    selectedSplitType === type && styles.splitSegmentButtonActive,
                  ]}
                  onPress={() => setSelectedSplitType(type)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.splitSegmentText,
                    selectedSplitType === type && styles.splitSegmentTextActive,
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Split Shares Editor */}
            <Text style={styles.sectionTitle}>Splits Summary</Text>
            <Card>
              {selectedSplitType === 'EQUAL' && (
                <View>
                  <Text style={styles.splitsMeta}>
                    Amount will be split equally among all {members.length} group members.
                  </Text>
                  {watchAmount ? (
                    <Text style={styles.splitsMetaHighlight}>
                      Each member pays: ₹{(Number(watchAmount) / members.length).toFixed(2)}
                    </Text>
                  ) : null}
                  {members.map((m) => (
                    <View key={m.id} style={styles.memberSplitRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <Text style={styles.memberShare}>
                        {watchAmount ? `₹ ${(Number(watchAmount) / members.length).toFixed(2)}` : 'Equal Share'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {selectedSplitType === 'EXACT' && (
                <View>
                  <Text style={styles.splitsMeta}>
                    Specify the exact rupee amount each member owes.
                  </Text>
                  {members.map((m) => (
                    <View key={m.id} style={styles.memberInputRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <View style={styles.amountInputWrap}>
                        <Input
                          placeholder="₹ 0.00"
                          keyboardType="numeric"
                          value={memberInputs[m.id]}
                          onChangeText={(text) => handleMemberInputChange(m.id, text)}
                          style={styles.inputOverride}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {selectedSplitType === 'PERCENTAGE' && (
                <View>
                  <Text style={styles.splitsMeta}>
                    Specify the percentage (%) share each member owes (must sum to 100%).
                  </Text>
                  {members.map((m) => (
                    <View key={m.id} style={styles.memberInputRow}>
                      <Text style={styles.memberName}>{m.name}</Text>
                      <View style={styles.pctInputWrap}>
                        <Input
                          placeholder="0 %"
                          keyboardType="numeric"
                          value={memberInputs[m.id]}
                          onChangeText={(text) => handleMemberInputChange(m.id, text)}
                          style={styles.inputOverride}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </Card>

            <Button
              title="Save Expense"
              onPress={handleSubmit(onSubmit)}
              isLoading={createExpenseMutation.isPending}
              style={styles.saveBtn}
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryItemActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#000000',
  },
  splitSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    marginBottom: 20,
  },
  splitSegmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  splitSegmentButtonActive: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  splitSegmentText: {
    color: Colors.muted,
    fontSize: 12,
    fontWeight: 'bold',
  },
  splitSegmentTextActive: {
    color: Colors.primary,
  },
  splitsMeta: {
    color: Colors.muted,
    fontSize: 13,
    marginBottom: 12,
  },
  splitsMetaHighlight: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  memberSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  memberShare: {
    color: Colors.muted,
    fontSize: 14,
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  amountInputWrap: {
    width: 120,
  },
  pctInputWrap: {
    width: 100,
  },
  inputOverride: {
    marginBottom: 0,
    height: 40,
    textAlign: 'right',
  },
  saveBtn: {
    marginTop: 24,
  },
});
