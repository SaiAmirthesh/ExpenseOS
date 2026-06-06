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
import { useTheme } from '../../src/theme/ThemeContext';
import { personalExpenseService, PersonalExpenseCategory } from '../../src/services/personalExpenseService';
import { getStorageItem, setStorageItem } from '../../src/store/storage';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';
import { ExpenseCard } from '../../src/components/common/ExpenseCard';
import { EmptyState } from '../../src/components/common/EmptyState';

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
  HEALTH: '#D7FF3F', // lime success
  EDUCATION: '#00E5FF',
  BILLS: '#FF9500',
  TRAVEL: '#D7FF3F',
  OTHER: '#B4BCD0',
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
  const { colors } = useTheme();
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
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.headerMonth, { color: colors.muted }]}>{getCurrentMonthLabel()}</Text>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Personal Vault</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => {
                setBudgetInput(budgetLimit > 0 ? String(budgetLimit) : '');
                setShowBudgetModal(true);
              }}
              activeOpacity={0.7}
            >
              <SettingsIcon size={20} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/personal-expenses/create')}
              activeOpacity={0.7}
            >
              <PlusIcon size={20} color={colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF'} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton height={180} style={{ borderRadius: 20 }} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Skeleton height={100} style={{ flex: 1, borderRadius: 20 }} />
              <Skeleton height={100} style={{ flex: 1, borderRadius: 20 }} />
            </View>
            <Skeleton height={200} style={{ borderRadius: 20 }} />
          </View>
        ) : (
          <>
            {/* Monthly Total Hero */}
            <Card style={[styles.heroCard, { borderLeftColor: colors.primary }]} delay={50}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={[styles.heroLabel, { color: colors.muted }]}>This Month's Spending</Text>
                  <Text style={[styles.heroAmount, { color: colors.text }, isOverBudget && { color: colors.error }]}>
                    ₹{monthlyTotal.toLocaleString()}
                  </Text>
                  <Text style={[styles.heroSub, { color: colors.muted }]}>
                    {monthlyExpenses.length} transaction{monthlyExpenses.length !== 1 ? 's' : ''} logged
                  </Text>
                </View>
                <View style={[styles.heroIconCircle, { backgroundColor: colors.primary + '15' }, isOverBudget && { backgroundColor: colors.error + '15' }]}>
                  <WalletIcon size={24} color={isOverBudget ? colors.error : colors.primary} />
                </View>
              </View>

              {/* Budget progress */}
              {budgetLimit > 0 ? (
                <View style={[styles.budgetSection, { borderTopColor: colors.border }]}>
                  <View style={styles.budgetRow}>
                    <Text style={[styles.budgetLabel, { color: colors.muted }]}>
                      {isOverBudget ? 'Budget Deficit' : 'Available Spending'}
                    </Text>
                    <Text style={[styles.budgetValue, { color: isOverBudget ? colors.error : colors.primary }]}>
                      {isOverBudget
                        ? `₹${(monthlyTotal - budgetLimit).toLocaleString()}`
                        : `₹${spendingLeft!.toLocaleString()}`}
                    </Text>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.round(budgetProgress * 100)}%` as any,
                          backgroundColor: isOverBudget
                            ? colors.error
                            : budgetProgress > 0.8
                            ? colors.warning
                            : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.budgetLimits}>
                    <Text style={[styles.budgetLimitText, { color: colors.muted }]}>₹0</Text>
                    <Text style={[styles.budgetLimitText, { color: colors.muted }]}>
                      Limit: ₹{budgetLimit.toLocaleString()}
                    </Text>
                  </View>
                  {isOverBudget && (
                    <View style={[styles.overBudgetAlert, { backgroundColor: colors.error + '10' }]}>
                      <AlertCircleIcon size={14} color={colors.error} />
                      <Text style={[styles.overBudgetText, { color: colors.error }]}>
                        You have exceeded your monthly budget ceiling!
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.setBudgetPrompt, { borderTopColor: colors.border }]}
                  onPress={() => setShowBudgetModal(true)}
                  activeOpacity={0.7}
                >
                  <TargetIcon size={14} color={colors.primary} />
                  <Text style={[styles.setBudgetPromptText, { color: colors.primary }]}>Set a monthly budget target</Text>
                  <ChevronRightIcon size={14} color={colors.primary} />
                </TouchableOpacity>
              )}
            </Card>

            {/* Quick Stats Row */}
            <View style={styles.statsRow}>
              <Card style={styles.statChip} delay={100}>
                <TrendingUpIcon size={16} color={colors.primary} />
                <Text style={[styles.statChipValue, { color: colors.text }]}>
                  {monthlyExpenses.length > 0
                    ? `₹${Math.round(monthlyTotal / monthlyExpenses.length).toLocaleString()}`
                    : '₹0'}
                </Text>
                <Text style={[styles.statChipLabel, { color: colors.muted }]}>AVERAGE COST</Text>
              </Card>
              <Card style={styles.statChip} delay={150}>
                <TargetIcon size={16} color={budgetLimit > 0 ? colors.primary : colors.muted} />
                <Text style={[styles.statChipValue, { color: colors.text }]}>
                  {budgetLimit > 0 ? `₹${budgetLimit.toLocaleString()}` : 'No target'}
                </Text>
                <Text style={[styles.statChipLabel, { color: colors.muted }]}>MONTH CEILING</Text>
              </Card>
            </View>

            {/* Recent Expenses */}
            <View style={styles.recentHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Flow</Text>
              <TouchableOpacity
                onPress={() => router.push('/personal-expenses')}
                activeOpacity={0.7}
              >
                <Text style={[styles.seeAllText, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>

            {recentFive.length === 0 ? (
              <EmptyState
                title="No transactions logged"
                description="Start tracking your individual spending vault accounts now."
                icon={<WalletIcon size={32} color={colors.muted} />}
                actionTitle="Add Expense"
                onActionPress={() => router.push('/personal-expenses/create')}
              />
            ) : (
              recentFive.map((expense, idx) => {
                const cat = expense.category as PersonalExpenseCategory;
                const color = CATEGORY_COLORS[cat] || colors.muted;
                const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
                return (
                  <ExpenseCard
                    key={expense.id}
                    title={expense.title}
                    amount={expense.amount}
                    date={expense.expenseDate}
                    category={cat}
                    categoryColor={color}
                    categoryIcon={<CatIcon size={18} color={color} />}
                    onPress={() =>
                      router.push({
                        pathname: '/personal-expenses/create',
                        params: { id: expense.id },
                      })
                    }
                    delay={200 + idx * 50}
                  />
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
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Set Monthly Target</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)} activeOpacity={0.7}>
                <XIcon size={20} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalSubtext, { color: colors.muted }]}>
              Set a limit for your monthly personal spending. You'll see progress and alerts when nearing the limit.
            </Text>
            
            <Input
              label="Budget Ceiling (₹)"
              placeholder="e.g. 25000"
              keyboardType="numeric"
              value={budgetInput}
              onChangeText={setBudgetInput}
              autoFocus
            />

            {budgetLimit > 0 && (
              <Text style={[styles.currentLimit, { color: colors.muted }]}>
                Current limit: ₹{budgetLimit.toLocaleString()}
              </Text>
            )}
            <View style={styles.modalActions}>
              {budgetLimit > 0 && (
                <Button
                  title="Clear Ceiling"
                  variant="outline"
                  onPress={() => {
                    setBudgetLimit(0);
                    setStorageItem(STORAGE_KEY_BUDGET, '0');
                    setShowBudgetModal(false);
                  }}
                  style={styles.clearBtn}
                  textStyle={{ color: colors.error }}
                />
              )}
              <Button
                title="Save Target"
                onPress={saveBudget}
                style={styles.saveBtn}
              />
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerMonth: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
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
    borderRadius: 14,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 38,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
    letterSpacing: -1,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
  },
  heroIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
  },
  budgetValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
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
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
  },
  overBudgetAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderRadius: 10,
    padding: 10,
  },
  overBudgetText: {
    color: Colors.error,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  setBudgetPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 14,
  },
  setBudgetPromptText: {
    flex: 1,
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 6,
    marginBottom: 0,
  },
  statChipValue: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  statChipLabel: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    letterSpacing: 0.5,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAllText: {
    color: Colors.primary,
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 16, 32, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  modalSubtext: {
    color: Colors.muted,
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 20,
  },
  currentLimit: {
    color: Colors.muted,
    fontSize: 12,
    fontFamily: 'Inter-Regular',
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
    flex: 1,
    borderColor: 'rgba(255,107,107,0.2)',
  },
  saveBtn: {
    flex: 1,
  },
});
