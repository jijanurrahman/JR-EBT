import React, { useCallback, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  copyBudgetsFromPreviousMonth,
  deleteBudget,
  getBudgetsForMonth,
} from '@/db/queries';
import { BudgetWithCategory } from '@/db/types';
import { formatDisplayMonth, getPreviousMonth } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { Button, EmptyState } from '@/components';
import { useUIStore } from '@/lib/store';
import { BudgetFormModal } from '../components/BudgetFormModal';
import { BudgetItem } from '../components/BudgetItem';

export function BudgetsScreen() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const { selectedMonth, nextMonth, previousMonth, transactionsVersion, currency: _currency } =
    useUIStore();

  const [budgets, setBudgets] = useState<BudgetWithCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithCategory | null>(
    null,
  );

  const loadBudgets = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBudgetsForMonth(selectedMonth);
      setBudgets(data);
    } catch (err) {
      console.warn('Failed to load budgets:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  React.useEffect(() => {
    loadBudgets();
  }, [loadBudgets, transactionsVersion]);

  useFocusEffect(
    useCallback(() => {
      loadBudgets();
    }, [loadBudgets]),
  );

  const totalLimitCents = budgets.reduce((acc, b) => acc + b.limit_cents, 0);
  const totalSpentCents = budgets.reduce((acc, b) => acc + b.spent_cents, 0);
  const totalRemainingCents = totalLimitCents - totalSpentCents;
  const isOverallOverBudget = totalSpentCents > totalLimitCents;

  const handleCopyPreviousMonth = async () => {
    try {
      const prevMonth = getPreviousMonth(selectedMonth);
      const copiedCount = await copyBudgetsFromPreviousMonth(
        prevMonth,
        selectedMonth,
      );
      if (copiedCount > 0) {
        Alert.alert(
          'Budgets Copied',
          `Copied ${copiedCount} budget limit(s) from ${formatDisplayMonth(prevMonth)}.`,
        );
        await loadBudgets();
      } else {
        Alert.alert(
          'No Budgets Found',
          `No budgets were found in ${formatDisplayMonth(prevMonth)} to copy.`,
        );
      }
    } catch (err) {
      console.warn('Failed to copy budgets:', err);
      Alert.alert('Error', 'Failed to copy budgets from previous month.');
    }
  };

  const handleDeleteBudget = (budget: BudgetWithCategory) => {
    Alert.alert(
      'Remove Budget',
      `Are you sure you want to remove the budget for ${budget.category_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              await loadBudgets();
            } catch (err) {
              console.warn('Failed to delete budget:', err);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={loadBudgets}
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

      {/* Summary Card */}
      {budgets.length > 0 ? (
        <View
          style={[
            styles.summaryCard,
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
              styles.summaryLabel,
              { color: colors.textSecondary, fontSize: typography.sizes.sm },
            ]}
          >
            Total Budget Status
          </Text>
          <Text
            style={[
              styles.summaryAmount,
              {
                color: isOverallOverBudget ? colors.danger : colors.textPrimary,
                fontSize: typography.sizes.xxl,
              },
            ]}
          >
            {formatCents(totalSpentCents)}{' '}
            <Text
              style={{
                fontSize: typography.sizes.lg,
                color: colors.textMuted,
                fontWeight: typography.weights.regular,
              }}
            >
              / {formatCents(totalLimitCents)}
            </Text>
          </Text>

          <Text
            style={{
              color: isOverallOverBudget ? colors.danger : colors.primary,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.semibold,
              marginTop: spacing.xs,
            }}
          >
            {isOverallOverBudget
              ? `${formatCents(Math.abs(totalRemainingCents))} overall over budget!`
              : `${formatCents(totalRemainingCents)} left to spend this month`}
          </Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={{ marginBottom: spacing.lg }}>
        <Button
          title="+ Set Category Budget"
          onPress={() => {
            setEditingBudget(null);
            setIsModalVisible(true);
          }}
          variant="primary"
          size="lg"
          style={{ marginBottom: spacing.sm }}
        />

        {budgets.length === 0 ? (
          <Button
            title="Copy Last Month's Budgets"
            onPress={handleCopyPreviousMonth}
            variant="secondary"
            size="md"
          />
        ) : null}
      </View>

      {/* Budgets List or Empty State */}
      {budgets.length === 0 ? (
        <EmptyState
          title="No budgets configured"
          description={`Set monthly spending limits for ${formatDisplayMonth(selectedMonth)} or copy limits from last month.`}
        />
      ) : (
        <View>
          {budgets.map((item) => (
            <BudgetItem
              key={item.id}
              budget={item}
              onPress={() => {
                setEditingBudget(item);
                setIsModalVisible(true);
              }}
              onDelete={() => handleDeleteBudget(item)}
            />
          ))}
        </View>
      )}

      <BudgetFormModal
        visible={isModalVisible}
        month={selectedMonth}
        editingBudget={editingBudget}
        onClose={() => {
          setIsModalVisible(false);
          setEditingBudget(null);
        }}
        onSaved={loadBudgets}
      />
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
  summaryCard: {
    borderWidth: 1,
  },
  summaryLabel: {
    marginBottom: 4,
  },
  summaryAmount: {
    fontWeight: '700',
  },
});
