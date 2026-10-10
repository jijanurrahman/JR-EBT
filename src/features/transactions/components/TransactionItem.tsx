import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionWithCategory } from '@/db/types';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';

interface TransactionItemProps {
  transaction: TransactionWithCategory;
  onPress: () => void;
  onDelete: () => void;
}

export function TransactionItem({
  transaction,
  onPress,
  onDelete,
}: TransactionItemProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const isIncome = transaction.type === 'income';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.borderLight : colors.surface,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
          borderBottomColor: colors.borderLight,
          borderBottomWidth: 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: transaction.category_color,
            borderRadius: radii.md,
            marginRight: spacing.md,
          },
        ]}
      >
        <Ionicons
          name={(transaction.category_icon as keyof typeof Ionicons.glyphMap) || 'receipt-outline'}
          size={20}
          color="#FFFFFF"
        />
      </View>

      <View style={styles.content}>
        <Text
          style={[
            styles.categoryName,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              fontWeight: typography.weights.semibold,
            },
          ]}
          numberOfLines={1}
        >
          {transaction.category_name}
        </Text>
        {transaction.note ? (
          <Text
            style={[
              styles.note,
              {
                color: colors.textMuted,
                fontSize: typography.sizes.xs,
                marginTop: 2,
              },
            ]}
            numberOfLines={1}
          >
            {transaction.note}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            {
              color: isIncome ? colors.income : colors.textPrimary,
              fontSize: typography.sizes.md,
              fontWeight: typography.weights.bold,
            },
          ]}
        >
          {isIncome ? '+' : '-'}
          {formatCents(transaction.amount_cents)}
        </Text>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          hitSlop={8}
          style={styles.deleteButton}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  categoryName: {},
  note: {},
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 8,
  },
  amount: {},
  deleteButton: {
    marginTop: 4,
    padding: 2,
  },
});
