import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Wallet,
  SlidersHorizontal,
  X,
  TrendingUp,
  Utensils,
  Car,
  ShoppingCart,
  Gamepad2,
  HeartPulse,
  BookOpen,
  FileText,
  Plane,
  Package,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '../../src/theme/theme';
import {
  personalExpenseService,
  PersonalExpenseCategory,
  PersonalExpenseResponse,
} from '../../src/services/personalExpenseService';
import { PERSONAL_EXPENSE_CATEGORIES } from '../../src/features/personal-expenses/schemas/personalExpenseSchema';

// Icon casts
const ArrowLeftIcon = ArrowLeft as any;
const PlusIcon = Plus as any;
const Trash2Icon = Trash2 as any;
const Edit2Icon = Edit2 as any;
const WalletIcon = Wallet as any;
const SlidersIcon = SlidersHorizontal as any;
const XIcon = X as any;
const TrendingUpIcon = TrendingUp as any;
const UtensilsIcon = Utensils as any;
const CarIcon = Car as any;
const ShoppingCartIcon = ShoppingCart as any;
const Gamepad2Icon = Gamepad2 as any;
const HeartPulseIcon = HeartPulse as any;
const BookOpenIcon = BookOpen as any;
const FileTextIcon = FileText as any;
const PlaneIcon = Plane as any;
const PackageIcon = Package as any;

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

export default function PersonalExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [selectedCategory, setSelectedCategory] = useState<PersonalExpenseCategory | null>(null);

  const { data: expenses = [], isLoading, refetch } = useQuery({
    queryKey: ['personalExpenses'],
    queryFn: personalExpenseService.getAllExpenses,
  });

  const deleteMutation = useMutation({
    mutationFn: personalExpenseService.deleteExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalExpenses'] });
      refetch();
    },
  });

  const handleDelete = (id: number, title: string) => {
    Alert.alert(
      'Delete Expense',
      `Remove "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
      ]
    );
  };

  const filtered = useMemo(() => {
    if (!selectedCategory) return expenses;
    return expenses.filter((e) => e.category === selectedCategory);
  }, [expenses, selectedCategory]);

  const totalSpend = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const filteredSpend = useMemo(
    () => filtered.reduce((sum, e) => sum + e.amount, 0),
    [filtered]
  );

  // Top 3 categories by spend
  const topCategories = useMemo(() => {
    const map: Partial<Record<PersonalExpenseCategory, number>> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3) as [PersonalExpenseCategory, number][];
  }, [expenses]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Expenses</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/personal-expenses/create')}
          activeOpacity={0.7}
        >
          <PlusIcon size={20} color="#000000" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

          {/* Hero Stats Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View>
                <Text style={styles.heroLabel}>
                  {selectedCategory ? selectedCategory : 'Total Spending'}
                </Text>
                <Text style={styles.heroAmount}>
                  ₹{(selectedCategory ? filteredSpend : totalSpend).toLocaleString()}
                </Text>
                <Text style={styles.heroSub}>
                  {filtered.length} expense{filtered.length !== 1 ? 's' : ''}
                  {selectedCategory ? ' in this category' : ' tracked'}
                </Text>
              </View>
              <View style={styles.heroIconCircle}>
                <WalletIcon size={26} color={Colors.primary} />
              </View>
            </View>

            {/* Top categories breakdown */}
            {!selectedCategory && topCategories.length > 0 && (
              <View style={styles.breakdownRow}>
                {topCategories.map(([cat, amt]) => {
                  const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
                  const color = CATEGORY_COLORS[cat];
                  return (
                    <View key={cat} style={styles.breakdownChip}>
                      <CatIcon size={12} color={color} />
                      <Text style={[styles.breakdownAmt, { color }]}>
                        ₹{(amt as number).toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
                <View style={styles.breakdownChip}>
                  <TrendingUpIcon size={12} color={Colors.muted} />
                  <Text style={[styles.breakdownAmt, { color: Colors.muted }]}>Top 3</Text>
                </View>
              </View>
            )}
          </View>

          {/* Category Filter Pills */}
          <View style={styles.filterHeader}>
            <SlidersIcon size={14} color={Colors.muted} />
            <Text style={styles.filterLabel}>Filter by Category</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
          >
            <TouchableOpacity
              style={[styles.pill, !selectedCategory && styles.pillActive]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, !selectedCategory && styles.pillTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {PERSONAL_EXPENSE_CATEGORIES.map((cat) => {
              const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
              const color = CATEGORY_COLORS[cat];
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pill,
                    isActive && styles.pillActive,
                    isActive && { borderColor: color },
                  ]}
                  onPress={() => setSelectedCategory(isActive ? null : cat)}
                  activeOpacity={0.7}
                >
                  <CatIcon size={13} color={isActive ? color : Colors.muted} />
                  <Text
                    style={[
                      styles.pillText,
                      isActive && styles.pillTextActive,
                      isActive && { color },
                    ]}
                  >
                    {cat.charAt(0) + cat.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active filter badge */}
          {selectedCategory && (
            <TouchableOpacity
              style={styles.clearFilter}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.clearFilterText}>
                Showing: {selectedCategory} · ₹{filteredSpend.toLocaleString()}
              </Text>
              <XIcon size={14} color={Colors.secondary} />
            </TouchableOpacity>
          )}

          {/* Expense List */}
          <Text style={styles.sectionTitle}>
            {selectedCategory ? `${selectedCategory} Expenses` : 'All Expenses'}
          </Text>

          {filtered.length === 0 ? (
            <View style={styles.emptyContainer}>
              <WalletIcon size={48} color={Colors.muted} />
              <Text style={styles.emptyTitle}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>
                {selectedCategory
                  ? 'No expenses in this category.'
                  : 'Tap + to log your first expense.'}
              </Text>
              {!selectedCategory && (
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => router.push('/personal-expenses/create')}
                  activeOpacity={0.7}
                >
                  <PlusIcon size={16} color="#000000" />
                  <Text style={styles.emptyActionText}>Add Expense</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filtered.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                onEdit={() =>
                  router.push({ pathname: '/personal-expenses/create', params: { id: expense.id } })
                }
                onDelete={() => handleDelete(expense.id, expense.title)}
                isDeleting={deleteMutation.isPending}
              />
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  isDeleting,
}: {
  expense: PersonalExpenseResponse;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const cat = expense.category as PersonalExpenseCategory;
  const color = CATEGORY_COLORS[cat] || Colors.muted;
  const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;

  return (
    <View style={[styles.expenseCard, { borderLeftColor: color }]}>
      <View style={[styles.expenseIconBox, { backgroundColor: `${color}22` }]}>
        <CatIcon size={18} color={color} />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseTitle} numberOfLines={1}>
          {expense.title}
        </Text>
        <View style={styles.expenseMeta}>
          <View style={[styles.categoryBadge, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
            <Text style={[styles.categoryBadgeText, { color }]}>
              {cat.charAt(0) + cat.slice(1).toLowerCase()}
            </Text>
          </View>
          <Text style={styles.expenseDate}>{expense.expenseDate}</Text>
        </View>
      </View>
      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>₹{expense.amount.toLocaleString()}</Text>
        <View style={styles.expenseActions}>
          <TouchableOpacity onPress={onEdit} style={styles.iconBtn} activeOpacity={0.7}>
            <Edit2Icon size={14} color={Colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.iconBtn}
            disabled={isDeleting}
            activeOpacity={0.7}
          >
            <Trash2Icon size={14} color={Colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
  backBtn: { padding: 6 },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  container: { flex: 1 },
  content: { padding: 24 },

  // Hero
  heroCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroAmount: {
    fontSize: 36,
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
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexWrap: 'wrap',
  },
  breakdownChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownAmt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Filter pills
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsScroll: { marginBottom: 12 },
  pillsContainer: { gap: 8, paddingRight: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
  },
  pillTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 229, 255, 0.08)',
    borderWidth: 1,
    borderColor: Colors.secondary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  clearFilterText: {
    color: Colors.secondary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    marginTop: 4,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
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

  // Expense card
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  expenseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expenseInfo: { flex: 1 },
  expenseTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  expenseDate: {
    color: Colors.muted,
    fontSize: 11,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  expenseAmount: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  expenseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
});
