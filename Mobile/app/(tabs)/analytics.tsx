import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, G, LinearGradient, Stop } from 'react-native-svg';
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft, PieChart, LineChart } from 'lucide-react-native';

import { useAuth } from '../../src/store/authContext';
import { Colors } from '../../src/theme/theme';
import { useTheme } from '../../src/theme/ThemeContext';
import { personalExpenseService, PersonalExpenseCategory } from '../../src/services/personalExpenseService';
import { groupService } from '../../src/services/groupService';
import { balanceService } from '../../src/services/balanceService';
import { Card } from '../../src/components/common/Card';
import { StatCard } from '../../src/components/common/StatCard';
import { EmptyState } from '../../src/components/common/EmptyState';

const TrendingUpIcon = TrendingUp as any;
const WalletIcon = Wallet as any;
const ArrowUpRightIcon = ArrowUpRight as any;
const ArrowDownLeftIcon = ArrowDownLeft as any;
const PieChartIcon = PieChart as any;
const LineChartIcon = LineChart as any;

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

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();

  // Queries
  const { data: personalExpenses = [], isLoading: loadingPersonal } = useQuery({
    queryKey: ['personalExpenses'],
    queryFn: personalExpenseService.getAllExpenses,
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: groupService.listGroups,
  });

  const { data: globalBalances = { owedToYou: 0, youOwe: 0 }, isLoading: loadingBalances } = useQuery({
    queryKey: ['globalBalances', groups.map(g => g.id)],
    enabled: groups.length > 0,
    queryFn: async () => {
      let totalOwed = 0;
      let totalOwe = 0;

      const balancePromises = groups.map(group =>
        balanceService.getBalances(group.id).catch(() => [])
      );

      const allGroupBalances = await Promise.all(balancePromises);

      allGroupBalances.forEach(groupBalances => {
        const myBalance = groupBalances.find(b =>
          b.name.toLowerCase() === user.name?.toLowerCase() ||
          b.userId.toString() === user.id
        );

        if (myBalance) {
          if (myBalance.balance > 0) {
            totalOwed += myBalance.balance;
          } else if (myBalance.balance < 0) {
            totalOwe += Math.abs(myBalance.balance);
          }
        }
      });

      return {
        owedToYou: totalOwed,
        youOwe: totalOwe,
      };
    }
  });

  // 1. Total Personal Outflow
  const totalPersonalSpend = useMemo(() => {
    return personalExpenses.reduce((sum, item) => sum + item.amount, 0);
  }, [personalExpenses]);

  // 2. Category Breakdown data for Pie/Donut Chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    personalExpenses.forEach((exp) => {
      const cat = exp.category;
      counts[cat] = (counts[cat] || 0) + exp.amount;
      total += exp.amount;
    });

    if (total === 0) return [];

    return Object.entries(counts).map(([category, amount]) => ({
      category: category as PersonalExpenseCategory,
      label: CATEGORY_LABELS[category as PersonalExpenseCategory] || category,
      amount,
      percentage: (amount / total) * 100,
      color: CATEGORY_COLORS[category as PersonalExpenseCategory] || Colors.primary,
    })).sort((a, b) => b.amount - a.amount);
  }, [personalExpenses]);

  // 3. 7-Day Trend data for Line Chart
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map((day) => {
      const sum = personalExpenses
        .filter((exp) => exp.expenseDate === day)
        .reduce((s, exp) => s + exp.amount, 0);
      return {
        date: day,
        dayLabel: new Date(day).toLocaleDateString('default', { weekday: 'short' }),
        amount: sum,
      };
    });
  }, [personalExpenses]);

  const maxTrendAmount = useMemo(() => {
    const max = Math.max(...trendData.map((d) => d.amount), 0);
    return max === 0 ? 1000 : max; // Default scale max
  }, [trendData]);

  // 4. Line Chart path drawing calculations
  const chartHeight = 100;
  const chartWidth = 320;
  const linePath = useMemo(() => {
    if (trendData.length === 0) return '';
    return trendData.map((d, i) => {
      const x = (i / (trendData.length - 1)) * chartWidth;
      const y = chartHeight - (d.amount / maxTrendAmount) * (chartHeight - 20) - 10;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [trendData, maxTrendAmount]);

  const fillPath = useMemo(() => {
    if (trendData.length === 0) return '';
    const points = trendData.map((d, i) => {
      const x = (i / (trendData.length - 1)) * chartWidth;
      const y = chartHeight - (d.amount / maxTrendAmount) * (chartHeight - 20) - 10;
      return `L ${x} ${y}`;
    }).join(' ');
    return `M 0 ${chartHeight} ${points} L ${chartWidth} ${chartHeight} Z`;
  }, [trendData, maxTrendAmount]);

  // Donut chart helper values (Radius = 50)
  const donutRadius = 50;
  const donutCircumference = 2 * Math.PI * donutRadius; // 314.16

  const isLoading = loadingPersonal || (groups.length > 0 && loadingBalances);

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.muted }]}>Personal & Group Ledger Analysis</Text>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Analytics</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>

          {/* Net Worth / Total Spending Stat Card */}
          <Card style={[styles.summaryCard, { borderLeftColor: colors.primary }]} delay={50}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Tracked Spending</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>₹{totalPersonalSpend.toLocaleString()}</Text>
              </View>
              <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '15' }]}>
                <WalletIcon size={22} color={colors.primary} />
              </View>
            </View>
          </Card>

          {/* Bento Grid Info Widgets */}
          <View style={styles.bentoGrid}>
            <View style={styles.bentoHalf}>
              <StatCard
                label="Owed to You"
                value={`₹${(globalBalances.owedToYou || 0).toLocaleString()}`}
                subtext="Total Receivables"
                icon={<ArrowUpRightIcon size={14} color={colors.primary} />}
                accentColor={colors.primary}
              />
            </View>
            <View style={styles.bentoHalf}>
              <StatCard
                label="You Owe"
                value={`₹${(globalBalances.youOwe || 0).toLocaleString()}`}
                subtext="Total Group Debts"
                icon={<ArrowDownLeftIcon size={14} color={colors.error} />}
                accentColor={colors.error}
              />
            </View>
          </View>

          {/* 1. Normal Graph: 7-Day Spending Velocity */}
          <View style={styles.chartHeader}>
            <LineChartIcon size={16} color={colors.primary} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>7-Day Spending Velocity</Text>
          </View>

          <Card style={styles.chartCard} delay={100}>
            {totalPersonalSpend === 0 ? (
              <View style={styles.emptyChartBox}>
                <Text style={[styles.emptyChartText, { color: colors.muted }]}>No spending recorded to render trend line.</Text>
              </View>
            ) : (
              <View>
                <View style={styles.lineChartWrap}>
                  <Svg height={chartHeight} width="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <LinearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <Stop offset="0%" stopColor={colors.primary} stopOpacity={0.25} />
                      <Stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                    </LinearGradient>

                    {/* Background Grid Lines */}
                    <Path d={`M 0 ${chartHeight / 2} L ${chartWidth} ${chartHeight / 2}`} stroke={colors.border} strokeWidth={1} />
                    <Path d={`M 0 10 L ${chartWidth} 10`} stroke={colors.border} strokeWidth={1} />

                    {/* Fill & Stroke */}
                    <Path d={fillPath} fill="url(#chartGrad)" />
                    <Path d={linePath} fill="none" stroke={colors.primary} strokeWidth={2.5} />
                  </Svg>
                </View>

                {/* X Axis Labels */}
                <View style={styles.xAxisRow}>
                  {trendData.map((d, index) => (
                    <Text key={index} style={[styles.xAxisLabel, { color: colors.muted }]}>
                      {d.dayLabel}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </Card>

          {/* 2. Pie Chart: Spending Breakdown by Category */}
          <View style={styles.chartHeader}>
            <PieChartIcon size={16} color={colors.primary} />
            <Text style={[styles.chartTitle, { color: colors.text }]}>Category Allocation</Text>
          </View>

          <Card style={styles.chartCard} delay={150}>
            {categoryData.length === 0 ? (
              <View style={styles.emptyChartBox}>
                <Text style={[styles.emptyChartText, { color: colors.muted }]}>No spending recorded to show category breakdown.</Text>
              </View>
            ) : (
              <View style={styles.pieRow}>
                {/* SVG Donut Chart */}
                <View style={styles.pieChartContainer}>
                  <Svg height="160" width="160" viewBox="0 0 160 160">
                    <G transform="rotate(-90, 80, 80)">
                      {/* Base Circle */}
                      <Circle cx="80" cy="80" r={donutRadius} fill="none" stroke={colors.surface} strokeWidth={18} />

                      {/* Render Donut Slices */}
                      {(() => {
                        let accumulatedPercent = 0;
                        return categoryData.map((item, idx) => {
                          const strokeOffset = donutCircumference - (item.percentage / 100) * donutCircumference;
                          const currentRotate = (accumulatedPercent / 100) * 360;
                          accumulatedPercent += item.percentage;

                          return (
                            <Circle
                              key={idx}
                              cx="80"
                              cy="80"
                              r={donutRadius}
                              fill="none"
                              stroke={item.color}
                              strokeWidth={18}
                              strokeDasharray={`${donutCircumference} ${donutCircumference}`}
                              strokeDashoffset={strokeOffset}
                              transform={`rotate(${currentRotate}, 80, 80)`}
                            />
                          );
                        });
                      })()}
                    </G>
                  </Svg>
                </View>

                {/* Legend list */}
                <View style={styles.legendContainer}>
                  {categoryData.slice(0, 5).map((item, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendIndicator, { backgroundColor: item.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.legendLabel, { color: colors.text }]}>{item.label}</Text>
                        <Text style={[styles.legendPct, { color: colors.muted }]}>{item.percentage.toFixed(0)}%</Text>
                      </View>
                      <Text style={[styles.legendValue, { color: colors.text }]}>₹{item.amount.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    paddingHorizontal: 24,
  },
  summaryCard: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-ExtraBold',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(215, 255, 63, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  bentoHalf: {
    flex: 1,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chartCard: {
    padding: 16,
    marginBottom: 20,
  },
  emptyChartBox: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    textAlign: 'center',
  },
  lineChartWrap: {
    marginTop: 10,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  xAxisLabel: {
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: Colors.muted,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pieChartContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendContainer: {
    flex: 1,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendIndicator: {
    width: 10,
    height: 10,
    borderRadius: 3,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
  },
  legendPct: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: Colors.muted,
    marginTop: 1,
  },
  legendValue: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
});
