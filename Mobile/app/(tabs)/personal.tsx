import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  Wallet,
  Plus,
  Target,
  TrendingUp,
  ShoppingCart,
  Car,
  Utensils,
  Gamepad2,
  HeartPulse,
  BookOpen,
  FileText,
  Plane,
  Package,
  ArrowRight,
  Settings,
  Check,
  X,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../src/theme/theme';
import { personalExpenseService, PersonalExpenseCategory } from '../../src/services/personalExpenseService';
import { getStorageItem, setStorageItem } from '../../src/store/storage';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';

// Icon casts
const WalletIcon = Wallet as any;
const PlusIcon = Plus as any;
const TargetIcon = Target as any;
const TrendingUpIcon = TrendingUp as any;
const ShoppingCartIcon = ShoppingCart as any;
const CarIcon = Car as any;
const UtensilsIcon = Utensils as any;
const Gamepad2Icon = Gamepad2 as any;
const HeartPulseIcon = HeartPulse as any;
const BookOpenIcon = BookOpen as any;
const FileTextIcon = FileText as any;
const PlaneIcon = Plane as any;
const PackageIcon = Package as any;
const ArrowRightIcon = ArrowRight as any;
const SettingsIcon = Settings as any;
const CheckIcon = Check as any;
const XIcon = X as any;
const AlertCircleIcon = AlertCircle as any;
const ChevronRightIcon = ChevronRight as any;

const STORAGE_KEY_BUDGET = 'personal.monthlyBudgetLimit';

const CATEGORY_ICON_MAP: Record<PersonalExpenseCategory, any> = {
  FOOD: UtensilsIcon,
  TRANSPORT: CarIcon,
  SHOPPING: ShoppingCartIcon,
  ENTERTAINMENT: Gamepad2Icon,
  HEALTH: HeartPulseIcon,
  EDUCATION: BookOpenIcon,
  BILLS: FileTextIcon,
  TRAVEL: PlaneIcon,
  OTHER: PackageIcon,
};

const CATEGORY_COLORS: Record<PersonalExpenseCategory, string> = {
  FOOD: '#FF6B6B',
  TRANSPORT: '#4ECDC4',
  SHOPPING: '#FFE66D',
  ENTERTAINMENT: '#A855F7',
  HEALTH: '#34C759',
  EDUCATION: '#00E5FF',
  BILLS: '#FF9500',
  TRAVEL: '#39FF14',
  OTHER: '#A0A0A0',
};

function getCurrentMonthLabel(): string {
  return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
}

function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export default function PersonalTab() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState<number>(() => {
    const stored = getStorageItem(STORAGE_KEY_BUDGET);
    return stored ? Number(stored) : 0;
  });
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');

  const { data: allExpenses = [], isLoading, refetch } = useQuery({
    queryKey: ['personalExpenses'],
    queryFn: personalExpenseService.getAllExpenses,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const { start, end } = getCurrentMonthRange();

  const monthlyExpenses = useMemo(() => {
    return allExpenses.filter(
      (e) => e.expenseDate >= start && e.expenseDate <= end
    );
  }, [allExpenses, start, end]);

  const monthlyTotal = useMemo(
    () => monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
    [monthlyExpenses]
  );

  const spendingLeft = budgetLimit > 0 ? Math.max(0, budgetLimit - monthlyTotal) : null;
  const budgetProgress = budgetLimit > 0 ? Math.min(1, monthlyTotal / budgetLimit) : 0;
  const isOverBudget = budgetLimit > 0 && monthlyTotal > budgetLimit;

  // Recent 5 sorted by date desc
  const recentFive = useMemo(() => {
    return [...allExpenses]
      .sort((a, b) => b.expenseDate.localeCompare(a.expenseDate))
      .slice(0, 5);
  }, [allExpenses]);

  const saveBudget = () => {
    const val = Number(budgetInput);
    if (!isNaN(val) && val >= 0) {
      setBudgetLimit(val);
      setStorageItem(STORAGE_KEY_BUDGET, String(val));
    }
    setShowBudgetModal(false);
    setBudgetInput('');
  };

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
            <Text style={styles.headerMonth}>{getCurrentMonthLabel()}</Text>
            <Text style={styles.headerTitle}>My Spending</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setBudgetInput(budgetLimit > 0 ? String(budgetLimit) : '');
                setShowBudgetModal(true);
              }}
              activeOpacity={0.7}
            >
              <SettingsIcon size={20} color={Colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => router.push('/personal-expenses/create')}
              activeOpacity={0.7}
            >
              <PlusIcon size={20} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={160} style={{ borderRadius: 16 }} />
            <Skeleton height={100} style={{ borderRadius: 16 }} />
            <Skeleton height={200} style={{ borderRadius: 16 }} />
          </View>
        ) : (
          <>
            {/* Monthly Total Hero */}
            <Card style={styles.heroCard}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroLabel}>This Month's Total</Text>
                  <Text style={[styles.heroAmount, isOverBudget && { color: Colors.error }]}>
                    ₹{monthlyTotal.toLocaleString()}
                  </Text>
                  <Text style={styles.heroSub}>
                    {monthlyExpenses.length} expense{monthlyExpenses.length !== 1 ? 's' : ''} recorded
                  </Text>
                </View>
                <View style={[styles.heroIconCircle, isOverBudget && { backgroundColor: 'rgba(255,59,48,0.15)' }]}>
                  <WalletIcon size={26} color={isOverBudget ? Colors.error : Colors.primary} />
                </View>
              </View>

              {/* Budget progress */}
              {budgetLimit > 0 ? (
                <View style={styles.budgetSection}>
                  <View style={styles.budgetRow}>
                    <Text style={styles.budgetLabel}>
                      {isOverBudget ? 'Over Budget by' : 'Budget Remaining'}
                    </Text>
                    <Text style={[styles.budgetValue, { color: isOverBudget ? Colors.error : Colors.primary }]}>
                      {isOverBudget
                        ? `₹${(monthlyTotal - budgetLimit).toLocaleString()}`
                        : `₹${spendingLeft!.toLocaleString()}`}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(budgetProgress * 100)}%` as any,
                          backgroundColor: isOverBudget
                            ? Colors.error
                            : budgetProgress > 0.8
                            ? Colors.warning
                            : Colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetLimits}>
                    <Text style={styles.budgetLimitText}>₹0</Text>
                    <Text style={styles.budgetLimitText}>
                      Limit: ₹{budgetLimit.toLocaleString()}
                    </Text>
                  </View>
                  {isOverBudget && (
                    <View style={styles.overBudgetAlert}>
                      <AlertCircleIcon size={14} color={Colors.error} />
                      <Text style={styles.overBudgetText}>
                        You've exceeded your monthly budget limit!
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.setBudgetPrompt}
                  onPress={() => setShowBudgetModal(true)}
                  activeOpacity={0.7}
                >
                  <TargetIcon size={14} color={Colors.secondary} />
                  <Text style={styles.setBudgetPromptText}>Tap to set a monthly budget limit</Text>
                  <ChevronRightIcon size={14} color={Colors.secondary} />
                </TouchableOpacity>
              )}
            </Card>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <Card style={styles.statChip}>
                <TrendingUpIcon size={16} color={Colors.secondary} />
                <Text style={styles.statChipValue}>
                  {monthlyExpenses.length > 0
                    ? `₹${Math.round(monthlyTotal / monthlyExpenses.length).toLocaleString()}`
                    : '₹0'}
                </Text>
                <Text style={styles.statChipLabel}>Avg / expense</Text>
              </Card>
              <Card style={styles.statChip}>
                <TargetIcon size={16} color={budgetLimit > 0 ? Colors.primary : Colors.muted} />
                <Text style={styles.statChipValue}>
                  {budgetLimit > 0 ? `₹${budgetLimit.toLocaleString()}` : 'Not set'}
                </Text>
                <Text style={styles.statChipLabel}>Monthly limit</Text>
              </Card>
            </View>

            {/* Recent Expenses */}
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity
                onPress={() => router.push('/personal-expenses')}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentFive.length === 0 ? (
              <Card style={styles.emptyCard}>
                <WalletIcon size={32} color={Colors.muted} />
                <Text style={styles.emptyTitle}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Start logging your personal expenses to track spending.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => router.push('/personal-expenses/create')}
                  activeOpacity={0.7}
                >
                  <PlusIcon size={14} color="#000000" />
                  <Text style={styles.emptyActionText}>Add First Expense</Text>
                </TouchableOpacity>
              </Card>
            ) : (
              recentFive.map((expense) => {
                const cat = expense.category as PersonalExpenseCategory;
                const color = CATEGORY_COLORS[cat];
                const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
                return (
                  <TouchableOpacity
                    key={expense.id}
                    style={[styles.expenseRow, { borderLeftColor: color }]}
                    onPress={() =>
                      router.push({
                        pathname: '/personal-expenses/create',
                        params: { id: expense.id },
                      })
                    }
                    activeOpacity={0.75}
                  >
                    <View style={[styles.expenseIconBox, { backgroundColor: `${color}22` }]}>
                      <CatIcon size={18} color={color} />
                    </View>
                    <View style={styles.expenseInfo}>
                      <Text style={styles.expenseTitle} numberOfLines={1}>
                        {expense.title}
                      </Text>
                      <View style={styles.expenseMeta}>
                        <View
                          style={[
                            styles.catBadge,
                            { backgroundColor: `${color}20`, borderColor: `${color}55` },
                          ]}
                        >
                          <Text style={[styles.catBadgeText, { color }]}>
                            {cat.charAt(0) + cat.slice(1).toLowerCase()}
                          </Text>
                        </View>
                        <Text style={styles.expenseDate}>{expense.expenseDate}</Text>
                      </View>
                    </View>
                    <Text style={styles.expenseAmount}>
                      ₹{expense.amount.toLocaleString()}
                    </Text>
                    <ArrowRightIcon size={14} color={Colors.muted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })
            )}

            <View style={{ height: 40 }} />
          </>
        )}
      </ScrollView>

      {/* Budget Limit Modal */}
      <Modal
        visible={showBudgetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Monthly Budget</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)} activeOpacity={0.7}>
                <XIcon size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtext}>
              Set a limit for your monthly personal spending. You'll see progress and alerts when nearing the limit.
            </Text>
            <View style={styles.modalInputRow}>
              <Text style={styles.rupeeSymbol}>₹</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 10000"
                placeholderTextColor={Colors.muted}
                keyboardType="numeric"
                value={budgetInput}
                onChangeText={setBudgetInput}
                autoFocus
              />
            </View>
            {budgetLimit > 0 && (
              <Text style={styles.currentLimit}>
                Current limit: ₹{budgetLimit.toLocaleString()}
              </Text>
            )}
            <View style={styles.modalActions}>
              {budgetLimit > 0 && (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => {
                    setBudgetLimit(0);
                    setStorageItem(STORAGE_KEY_BUDGET, '0');
                    setShowBudgetModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearBtnText}>Clear Limit</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={saveBudget}
                activeOpacity={0.7}
              >
                <CheckIcon size={16} color="#000000" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    paddingTop: 8,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerMonth: {
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero card
  heroCard: {
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLabel: {
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 13,
    color: Colors.muted,
  },
  heroIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Budget
  budgetSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 13,
    color: Colors.muted,
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  budgetLimits: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetLimitText: {
    fontSize: 10,
    color: Colors.muted,
  },
  overBudgetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 6,
    padding: 8,
  },
  overBudgetText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  setBudgetPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  setBudgetPromptText: {
    flex: 1,
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  statChipValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statChipLabel: {
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  // Recent header
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Expense row
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 5,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  expenseDate: {
    color: Colors.muted,
    fontSize: 11,
  },
  expenseAmount: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptySubtext: {
    color: Colors.muted,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 6,
  },
  emptyActionText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalSubtext: {
    color: Colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  rupeeSymbol: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 14,
  },
  currentLimit: {
    color: Colors.muted,
    fontSize: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  clearBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearBtnText: {
    color: Colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
