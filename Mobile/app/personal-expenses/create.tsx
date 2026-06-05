import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
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
} from '../../src/services/personalExpenseService';
import {
  personalExpenseSchema,
  PersonalExpenseFields,
  PERSONAL_EXPENSE_CATEGORIES,
} from '../../src/features/personal-expenses/schemas/personalExpenseSchema';
import { Input } from '../../src/components/common/Input';
import { Button } from '../../src/components/common/Button';

const ArrowLeftIcon = ArrowLeft as any;
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

const CATEGORY_LABELS: Record<PersonalExpenseCategory, string> = {
  FOOD: 'Food',
  TRANSPORT: 'Transport',
  SHOPPING: 'Shopping',
  ENTERTAINMENT: 'Entertainment',
  HEALTH: 'Health',
  EDUCATION: 'Education',
  BILLS: 'Bills',
  TRAVEL: 'Travel',
  OTHER: 'Other',
};

function getTodayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CreateEditPersonalExpenseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;

  const { data: existingExpense, isLoading: loadingExisting } = useQuery({
    queryKey: ['personalExpense', id],
    queryFn: () => personalExpenseService.getExpense(Number(id)),
    enabled: isEditMode,
  });

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalExpenseFields>({
    resolver: zodResolver(personalExpenseSchema),
    defaultValues: {
      title: '',
      amount: undefined,
      category: undefined,
      description: '',
      expenseDate: getTodayDate(),
    },
  });

  useEffect(() => {
    if (existingExpense) {
      setValue('title', existingExpense.title);
      setValue('amount', existingExpense.amount);
      setValue('category', existingExpense.category);
      setValue('expenseDate', existingExpense.expenseDate);
    }
  }, [existingExpense]);

  const selectedCategory = watch('category');

  const createMutation = useMutation({
    mutationFn: personalExpenseService.createExpense,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalExpenses'] });
      router.back();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, data }: { expenseId: number; data: PersonalExpenseFields }) =>
      personalExpenseService.updateExpense(expenseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalExpenses'] });
      queryClient.invalidateQueries({ queryKey: ['personalExpense', id] });
      router.back();
    },
  });

  const onSubmit = (data: PersonalExpenseFields) => {
    if (isEditMode) {
      updateMutation.mutate({ expenseId: Number(id), data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  if (isEditMode && loadingExisting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeftIcon size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Expense' : 'New Expense'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Error banner */}
        {mutationError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>
              {(mutationError as any)?.response?.data?.message ||
                'Something went wrong. Please try again.'}
            </Text>
          </View>
        )}

        {/* Category Picker */}
        <Text style={styles.sectionLabel}>Category</Text>
        <Controller
          control={control}
          name="category"
          render={({ field: { onChange, value } }) => (
            <View>
              <View style={styles.categoryGrid}>
                {PERSONAL_EXPENSE_CATEGORIES.map((cat) => {
                  const isSelected = value === cat;
                  const color = CATEGORY_COLORS[cat];
                  const CatIcon = CATEGORY_ICON_MAP[cat] || PackageIcon;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        isSelected && {
                          borderColor: color,
                          backgroundColor: `${color}18`,
                        },
                      ]}
                      onPress={() => onChange(cat)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.chipIconBox,
                          { backgroundColor: isSelected ? `${color}25` : Colors.surface },
                        ]}
                      >
                        <CatIcon size={18} color={isSelected ? color : Colors.muted} />
                      </View>
                      <Text
                        style={[
                          styles.categoryChipText,
                          isSelected && { color, fontWeight: '700' },
                        ]}
                      >
                        {CATEGORY_LABELS[cat]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {errors.category && (
                <Text style={styles.fieldError}>{errors.category.message}</Text>
              )}
            </View>
          )}
        />

        {/* Selected category preview banner */}
        {selectedCategory && (
          <View
            style={[
              styles.previewBanner,
              { borderLeftColor: CATEGORY_COLORS[selectedCategory] },
            ]}
          >
            {(() => {
              const CatIcon = CATEGORY_ICON_MAP[selectedCategory] || PackageIcon;
              return (
                <CatIcon size={20} color={CATEGORY_COLORS[selectedCategory]} />
              );
            })()}
            <View>
              <Text style={styles.previewLabel}>Selected</Text>
              <Text
                style={[
                  styles.previewCategory,
                  { color: CATEGORY_COLORS[selectedCategory] },
                ]}
              >
                {CATEGORY_LABELS[selectedCategory]}
              </Text>
            </View>
          </View>
        )}

        {/* Title */}
        <Controller
          control={control}
          name="title"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Expense Title"
              placeholder="e.g. Lunch, Petrol, Netflix"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.title?.message}
            />
          )}
        />

        {/* Amount */}
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

        {/* Date */}
        <Controller
          control={control}
          name="expenseDate"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Date (YYYY-MM-DD)"
              placeholder={getTodayDate()}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              error={errors.expenseDate?.message}
            />
          )}
        />

        {/* Description */}
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Note (optional)"
              placeholder="Add a note..."
              onBlur={onBlur}
              onChangeText={onChange}
              value={value || ''}
              error={errors.description?.message}
            />
          )}
        />

        <Button
          title={isEditMode ? 'Save Changes' : 'Add Expense'}
          onPress={handleSubmit(onSubmit)}
          isLoading={isMutating}
          style={styles.submitBtn}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerRight: { width: 32 },
  container: { flex: 1 },
  content: { padding: 24 },

  errorBanner: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderWidth: 1,
    borderColor: Colors.error,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: '44%',
    flex: 1,
  },
  chipIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryChipText: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
    flexShrink: 1,
  },
  fieldError: {
    color: Colors.error,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },

  previewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    borderLeftWidth: 3,
  },
  previewLabel: {
    fontSize: 11,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewCategory: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },

  submitBtn: {
    marginTop: 8,
  },
});
