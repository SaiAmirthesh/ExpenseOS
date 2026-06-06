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
import { useTheme } from '../../src/theme/ThemeContext';
import {
  personalExpenseService,
  PersonalExpenseCategory,
} from '../../src/services/personalExpenseService';
import { PERSONAL_EXPENSE_CATEGORIES } from '../../src/features/personal-expenses/schemas/personalExpenseSchema';
import { Card } from '../../src/components/common/Card';
import { Skeleton } from '../../src/components/common/Skeleton';
import { ExpenseCard } from '../../src/components/common/ExpenseCard';
import { EmptyState } from '../../src/components/common/EmptyState';

const ArrowLeftIcon = ArrowLeft as any;
const PlusIcon = Plus as any;
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
  HEALTH: '#D7FF3F',
  EDUCATION: '#00E5FF',
  BILLS: '#FF9500',
  TRAVEL: '#D7FF3F',
  OTHER: '#B4BCD0',
};

export default function PersonalExpensesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const contrastIconColor = colors.primary === '#D7FF3F' ? '#000000' : '#FFFFFF';

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>All Expenses</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/personal-expenses/create')}
          activeOpacity={0.7}
        >
          <PlusIcon size={20} color={contrastIconColor} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Hero Stats Card */}
          <Card style={styles.heroCard} delay={50}>
            <View style={styles.heroTop}>
              <View>
                <Text style={[styles.heroLabel, { color: colors.muted }]}>
                  {selectedCategory ? `${selectedCategory} SPENDING` : 'Total Outflow'}
                </Text>
                <Text style={[styles.heroAmount, { color: colors.text }]}>
                  ₹{(selectedCategory ? filteredSpend : totalSpend).toLocaleString()}
                </Text>
                <Text style={[styles.heroSub, { color: colors.muted }]}>
                  {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
                  {selectedCategory ? ' in category' : ' tracked'}
                </Text>
              </View>
              <View style={[styles.heroIconCircle, { backgroundColor: colors.primary + '12' }]}>
                <WalletIcon size={24} color={colors.primary} />
              </View>
            </View>

            {/* Top categories breakdown */}
            {!selectedCategory && topCategories.length > 0 && (
              <View style={styles.breakdownRow}>
                {topCategories.map(([cat, amt]) => {
                  const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
                  const color = CATEGORY_COLORS[cat];
                  return (
                    <View key={cat} style={[styles.breakdownChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                      <CatIcon size={12} color={color} />
                      <Text style={[styles.breakdownAmt, { color }]}>
                        ₹{(amt as number).toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
                <View style={[styles.breakdownChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <TrendingUpIcon size={12} color={colors.muted} />
                  <Text style={[styles.breakdownAmt, { color: colors.muted }]}>Top Categories</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Category Filter Pills */}
          <View style={styles.filterHeader}>
            <SlidersIcon size={14} color={colors.muted} />
            <Text style={[styles.filterLabel, { color: colors.muted }]}>Filter by Category</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillsScroll}
            contentContainerStyle={styles.pillsContainer}
          >
            <TouchableOpacity
              style={[
                styles.pill,
                { backgroundColor: colors.surface, borderColor: colors.border },
                !selectedCategory && [styles.pillActive, { backgroundColor: colors.primary, borderColor: colors.primary }]
              ]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, { color: colors.muted }, !selectedCategory && [styles.pillTextActive, { color: contrastIconColor }]]}>
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
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    isActive && [styles.pillActive, { backgroundColor: colors.primary, borderColor: color }],
                  ]}
                  onPress={() => setSelectedCategory(isActive ? null : cat)}
                  activeOpacity={0.7}
                >
                  <CatIcon size={13} color={isActive ? (colors.primary === '#0052FF' ? contrastIconColor : color) : colors.muted} />
                  <Text
                    style={[
                      styles.pillText,
                      { color: colors.muted },
                      isActive && [styles.pillTextActive, { color: colors.primary === '#0052FF' ? contrastIconColor : color }],
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
              style={[styles.clearFilter, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}
              onPress={() => setSelectedCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>
                Category: {selectedCategory} · ₹{filteredSpend.toLocaleString()}
              </Text>
              <XIcon size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          {/* Expense List */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory ? `${selectedCategory} LEDGER` : 'TRANSACTION HISTORY'}
          </Text>

          {filtered.length === 0 ? (
            <EmptyState
              title="No transactions found"
              description={selectedCategory ? `You don't have any logged transactions under ${selectedCategory}.` : "Start logging your personal spending ledger now."}
              icon={<WalletIcon size={32} color={colors.muted} />}
              actionTitle={!selectedCategory ? "Add Expense" : undefined}
              onActionPress={!selectedCategory ? () => router.push('/personal-expenses/create') : undefined}
            />
          ) : (
            filtered.map((expense, idx) => {
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
                  onEdit={() =>
                    router.push({ pathname: '/personal-expenses/create', params: { id: expense.id } })
                  }
                  onDelete={() => handleDelete(expense.id, expense.title)}
                  delay={100 + idx * 40}
                />
              );
            })
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
  backBtn: { padding: 6 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
  container: { flex: 1 },
  content: { padding: 24 },
  heroCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 36,
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
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownAmt: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pillsScroll: { marginBottom: 16 },
  pillsContainer: { gap: 8, paddingRight: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    color: Colors.muted,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  pillTextActive: {
    color: Colors.primary,
  },
  clearFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  clearFilterText: {
    color: Colors.primary,
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 10,
  },
});
