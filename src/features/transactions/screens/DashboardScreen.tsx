import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  getBudgetsForMonth,
  getMonthlySummary,
  getTransactions,
} from '@/db/queries';
import {
  BudgetWithCategory,
  MonthlySummary,
  TransactionWithCategory,
} from '@/db/types';
import { formatDisplayMonth } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { Button, EmptyState, ProgressBar } from '@/components';
import { useUIStore } from '@/lib/store';
import { TransactionItem } from '../components/TransactionItem';

export function DashboardScreen() {
  const { colors, spacing, typography, radii } = useAppTheme();
  const { selectedMonth, nextMonth, previousMonth, transactionsVersion, currency: _currency } =
    useUIStore();

  const [summary, setSummary] = useState<MonthlySummary>({
    income_cents: 0,
    expense_cents: 0,
    net_cents: 0,
  });
  const [topBudgets, setTopBudgets] = useState<BudgetWithCategory[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<
    TransactionWithCategory[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = React.useCallback(async () => {
    try {
      setRefreshing(true);
      const [sum, txs, budgetList] = await Promise.all([
        getMonthlySummary(selectedMonth),
        getTransactions({ month: selectedMonth }),
        getBudgetsForMonth(selectedMonth),
      ]);
      setSummary(sum);
      setRecentTransactions(txs.slice(0, 5));
      // Sort budgets by highest percentage spent descending
      const sortedBudgets = [...budgetList].sort(
        (a, b) => b.percentage - a.percentage,
      );
      setTopBudgets(sortedBudgets.slice(0, 3));
    } catch (err) {
      console.warn('Failed to load dashboard data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData, transactionsVersion]);

  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData]),
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={loadDashboardData}
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
          style={[
            styles.monthText,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              fontWeight: typography.weights.bold,
            },
          ]}
        >
          {formatDisplayMonth(selectedMonth)}
        </Text>
        <Button title="▶" onPress={nextMonth} variant="ghost" size="sm" />
      </View>

      {/* Net Balance & Totals Card */}
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
            styles.cardLabel,
            { color: colors.textSecondary, fontSize: typography.sizes.sm },
          ]}
        >
          Net Cashflow
        </Text>
        <Text
          style={[
            styles.cardAmount,
            {
              color:
                summary.net_cents > 0
                  ? colors.income
                  : summary.net_cents < 0
                    ? colors.expense
                    : colors.textPrimary,
              fontSize: typography.sizes.xxl,
            },
          ]}
        >
          {summary.net_cents >= 0 ? '' : '-'}
          {formatCents(Math.abs(summary.net_cents))}
        </Text>

        <View style={[styles.row, { marginTop: spacing.md }]}>
          <View style={styles.metric}>
            <Text style={{ color: colors.income, fontSize: typography.sizes.xs }}>
              Income
            </Text>
            <Text
              style={{
                color: colors.income,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.bold,
              }}
            >
              +{formatCents(summary.income_cents)}
            </Text>
          </View>
          <View style={styles.metric}>
            <Text style={{ color: colors.expense, fontSize: typography.sizes.xs }}>
              Expenses
            </Text>
            <Text
              style={{
                color: colors.expense,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.bold,
              }}
            >
              -{formatCents(summary.expense_cents)}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Add Button */}
      <View style={{ marginBottom: spacing.lg }}>
        <Button
          title="+ Add Transaction"
          onPress={() => router.push('/modal/transaction')}
          variant="primary"
          size="lg"
        />
      </View>

      {/* Top Budgets Section */}
      {topBudgets.length > 0 ? (
        <View style={{ marginBottom: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.textPrimary,
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                },
              ]}
            >
              Budget Overview
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/budgets')}>
              <Text style={{ color: colors.primary, fontSize: typography.sizes.sm }}>
                See All
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.budgetCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.lg,
                padding: spacing.md,
                marginTop: spacing.xs,
              },
            ]}
          >
            {topBudgets.map((b, idx) => (
              <View
                key={b.id}
                style={{
                  marginBottom: idx === topBudgets.length - 1 ? 0 : spacing.md,
                }}
              >
                <View style={styles.budgetRow}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.sizes.sm,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    {b.category_name}
                  </Text>
                  <Text
                    style={{
                      color:
                        b.percentage >= 100
                          ? colors.danger
                          : b.percentage >= 80
                            ? colors.warning
                            : colors.textSecondary,
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.bold,
                    }}
                  >
                    {formatCents(b.spent_cents)} / {formatCents(b.limit_cents)} ({b.percentage}%)
                  </Text>
                </View>
                <View style={{ marginTop: spacing.xs }}>
                  <ProgressBar percent={b.percentage} height={6} />
                </View>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* Recent Transactions Section */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              fontWeight: typography.weights.bold,
            },
          ]}
        >
          Recent Transactions
        </Text>
        {recentTransactions.length > 0 ? (
          <Pressable onPress={() => router.push('/(tabs)/transactions')}>
            <Text style={{ color: colors.primary, fontSize: typography.sizes.sm }}>
              See All
            </Text>
          </Pressable>
        ) : null}
      </View>

      {recentTransactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Record income or expenses for this month to monitor your finances."
          actionTitle="Add Entry"
          onActionPress={() => router.push('/modal/transaction')}
        />
      ) : (
        <View
          style={[
            styles.recentCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.lg,
              overflow: 'hidden',
              marginTop: spacing.xs,
            },
          ]}
        >
          {recentTransactions.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onPress={() =>
                router.push({
                  pathname: '/modal/transaction',
                  params: { id: tx.id.toString() },
                })
              }
              onDelete={async () => {
                await loadDashboardData();
              }}
            />
          ))}
        </View>
      )}
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
  monthText: {},
  card: {
    borderWidth: 1,
  },
  cardLabel: {
    marginBottom: 4,
  },
  cardAmount: {
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metric: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {},
  budgetCard: {
    borderWidth: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentCard: {
    borderWidth: 1,
  },
});
