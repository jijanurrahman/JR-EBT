import React, { useCallback, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { PieChart, BarChart } from 'react-native-gifted-charts';
import {
  getExpenseBreakdownByCategory,
  getIncomeBreakdownByCategory,
  getMonthlyTrend,
} from '@/db/queries';
import { CategoryBreakdown, MonthlyTrend } from '@/db/types';
import {
  formatDisplayMonth,
  formatShortMonth,
  getLastNMonths,
} from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { Button, EmptyState } from '@/components';
import { useUIStore } from '@/lib/store';

type ReportTab = 'expense' | 'income';

export function ReportsScreen() {
  const { colors, spacing, typography, radii } = useAppTheme();
  const { selectedMonth, nextMonth, previousMonth, transactionsVersion } =
    useUIStore();

  const [activeTab, setActiveTab] = useState<ReportTab>('expense');
  const [breakdown, setBreakdown] = useState<CategoryBreakdown[]>([]);
  const [trendData, setTrendData] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(false);

  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);
      const [catData, trend] = await Promise.all([
        activeTab === 'expense'
          ? getExpenseBreakdownByCategory(selectedMonth)
          : getIncomeBreakdownByCategory(selectedMonth),
        getMonthlyTrend(getLastNMonths(selectedMonth, 6)),
      ]);
      setBreakdown(catData);
      setTrendData(trend);
    } catch (err) {
      console.warn('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadReportData();
    }, [loadReportData]),
  );

  React.useEffect(() => {
    loadReportData();
  }, [loadReportData, transactionsVersion]);

  // Prepare pie chart data
  const totalCents = breakdown.reduce((acc, b) => acc + b.total_cents, 0);
  const pieData = breakdown.map((b) => ({
    value: b.total_cents,
    color: b.category_color,
    text: Math.round((b.total_cents / Math.max(totalCents, 1)) * 100) + '%',
    label: b.category_name,
  }));

  // Prepare bar chart data (grouped: income green, expense red)
  const barData = trendData.flatMap((t) => [
    {
      value: t.income_cents / 100,
      label: formatShortMonth(t.month),
      spacing: 2,
      frontColor: colors.income,
      topLabelComponent: undefined,
    },
    {
      value: t.expense_cents / 100,
      frontColor: colors.expense,
      topLabelComponent: undefined,
    },
  ]);

  const tabs: Array<{ label: string; value: ReportTab }> = [
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadReportData}
          tintColor={colors.primary}
        />
      }
    >
      {/* Month Switcher */}
      <View
        style={[
          styles.monthBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.sm,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Button title="◀" onPress={previousMonth} variant="ghost" size="sm" />
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.sizes.md,
            fontWeight: typography.weights.bold,
          }}
        >
          {formatDisplayMonth(selectedMonth)}
        </Text>
        <Button title="▶" onPress={nextMonth} variant="ghost" size="sm" />
      </View>

      {/* Tab Toggle: Expense / Income */}
      <View
        style={[
          styles.tabToggle,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: spacing.xxs,
            marginBottom: spacing.lg,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.value;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[
                styles.tabButton,
                {
                  borderRadius: radii.sm,
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  paddingVertical: spacing.xs + 2,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? colors.textInverse : colors.textSecondary,
                  fontSize: typography.sizes.sm,
                  fontWeight: isActive
                    ? typography.weights.bold
                    : typography.weights.medium,
                  textAlign: 'center',
                }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Pie Chart Section */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          {activeTab === 'expense' ? 'Expense' : 'Income'} Breakdown
        </Text>

        {pieData.length === 0 ? (
          <EmptyState
            title={`No ${activeTab} data`}
            description={`Add some ${activeTab === 'expense' ? 'expenses' : 'income'} to see the breakdown chart.`}
          />
        ) : (
          <>
            <View style={styles.pieContainer}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                innerCircleColor={colors.surface}
                centerLabelComponent={() => (
                  <View style={styles.pieCenter}>
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: typography.sizes.xs,
                      }}
                    >
                      Total
                    </Text>
                    <Text
                      style={{
                        color:
                          activeTab === 'expense'
                            ? colors.expense
                            : colors.income,
                        fontSize: typography.sizes.md,
                        fontWeight: typography.weights.bold,
                      }}
                    >
                      {formatCents(totalCents)}
                    </Text>
                  </View>
                )}
              />
            </View>

            {/* Legend */}
            <View style={[styles.legend, { marginTop: spacing.lg }]}>
              {breakdown.map((b) => {
                const pct = Math.round(
                  (b.total_cents / Math.max(totalCents, 1)) * 100,
                );
                return (
                  <View
                    key={b.category_id}
                    style={[
                      styles.legendRow,
                      {
                        paddingVertical: spacing.xs,
                        borderBottomColor: colors.borderLight,
                      },
                    ]}
                  >
                    <View style={styles.legendLeft}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: b.category_color },
                        ]}
                      />
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: typography.sizes.sm,
                        }}
                        numberOfLines={1}
                      >
                        {b.category_name}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: typography.sizes.sm,
                          fontWeight: typography.weights.semibold,
                        }}
                      >
                        {formatCents(b.total_cents)}
                      </Text>
                      <Text
                        style={{
                          color: colors.textMuted,
                          fontSize: typography.sizes.xs,
                          marginLeft: spacing.xs,
                          minWidth: 36,
                          textAlign: 'right',
                        }}
                      >
                        {pct}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </View>

      {/* Monthly Trend Bar Chart */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.xxxl,
          },
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          6-Month Trend
        </Text>

        {/* Legend for bar chart */}
        <View style={[styles.barLegend, { marginBottom: spacing.md }]}>
          <View style={styles.barLegendItem}>
            <View
              style={[styles.barLegendDot, { backgroundColor: colors.income }]}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
              }}
            >
              Income
            </Text>
          </View>
          <View style={[styles.barLegendItem, { marginLeft: spacing.md }]}>
            <View
              style={[
                styles.barLegendDot,
                { backgroundColor: colors.expense },
              ]}
            />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
              }}
            >
              Expense
            </Text>
          </View>
        </View>

        {barData.length === 0 ? (
          <EmptyState
            title="No trend data"
            description="Add transactions across months to see the trend chart."
          />
        ) : (
          <BarChart
            data={barData}
            barWidth={16}
            spacing={14}
            roundedTop
            xAxisThickness={1}
            yAxisThickness={0}
            xAxisColor={colors.border}
            yAxisTextStyle={{
              color: colors.textMuted,
              fontSize: 10,
            }}
            xAxisLabelTextStyle={{
              color: colors.textMuted,
              fontSize: 10,
            }}
            noOfSections={4}
            hideRules
            isAnimated
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  tabToggle: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    borderWidth: 1,
  },
  cardTitle: {
    fontWeight: '600',
  },
  pieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  legend: {},
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLegend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
});
