import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BudgetWithCategory } from '@/db/types';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { ProgressBar } from '@/components/ProgressBar';

interface BudgetItemProps {
  budget: BudgetWithCategory;
  onPress: () => void;
  onDelete: () => void;
}

export function BudgetItem({ budget, onPress, onDelete }: BudgetItemProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const isOverBudget = budget.spent_cents > budget.limit_cents;
  const overAmountCents = budget.spent_cents - budget.limit_cents;

  let badgeBgColor = `${colors.primary}15`;
  let badgeTextColor = colors.primary;
  if (budget.percentage >= 100) {
    badgeBgColor = `${colors.danger}15`;
    badgeTextColor = colors.danger;
  } else if (budget.percentage >= 80) {
    badgeBgColor = `${colors.warning}15`;
    badgeTextColor = colors.warning;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.borderLight : colors.surface,
          padding: spacing.md,
          borderColor: isOverBudget ? `${colors.danger}60` : colors.border,
          borderWidth: 1,
          borderRadius: radii.lg,
          marginBottom: spacing.md,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.leftInfo}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: budget.category_color,
                borderRadius: radii.md,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Ionicons
              name={
                (budget.category_icon as keyof typeof Ionicons.glyphMap) ||
                'wallet-outline'
              }
              size={18}
              color="#FFFFFF"
            />
          </View>
          <Text
            style={[
              styles.categoryName,
              {
                color: colors.textPrimary,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
              },
            ]}
          >
            {budget.category_name}
          </Text>
        </View>

        <View style={styles.rightActions}>
          <View
            style={[
              styles.percentageBadge,
              {
                backgroundColor: badgeBgColor,
                borderRadius: radii.full,
                paddingHorizontal: spacing.sm,
                paddingVertical: 2,
                marginRight: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.percentageText,
                {
                  color: badgeTextColor,
                  fontSize: typography.sizes.xs,
                  fontWeight: typography.weights.bold,
                },
              ]}
            >
              {budget.percentage}%
            </Text>
          </View>

          <Pressable onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={{ marginVertical: spacing.sm }}>
        <ProgressBar percent={budget.percentage} height={8} />
      </View>

      {/* Amounts Row */}
      <View style={styles.bottomRow}>
        <Text
          style={[
            styles.spentText,
            { color: colors.textSecondary, fontSize: typography.sizes.sm },
          ]}
        >
          {formatCents(budget.spent_cents)}{' '}
          <Text style={{ color: colors.textMuted }}>
            / {formatCents(budget.limit_cents)}
          </Text>
        </Text>

        <Text
          style={[
            styles.remainingText,
            {
              color: isOverBudget ? colors.danger : colors.textMuted,
              fontSize: typography.sizes.xs,
              fontWeight: isOverBudget
                ? typography.weights.bold
                : typography.weights.regular,
            },
          ]}
        >
          {isOverBudget
            ? `${formatCents(overAmountCents)} over!`
            : `${formatCents(budget.remaining_cents)} left`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryName: {},
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  percentageBadge: {},
  percentageText: {},
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {},
  remainingText: {},
});

