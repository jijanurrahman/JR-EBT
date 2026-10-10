import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType, TransactionWithCategory } from '@/db/types';
import { formatDisplayMonth } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { EmptyState, Snackbar } from '@/components';
import { useUIStore } from '@/lib/store';
import { TransactionFiltersBar } from '../components/TransactionFiltersBar';
import { TransactionItem } from '../components/TransactionItem';
import { DayGroup, useTransactions } from '../hooks/useTransactions';

export function TransactionsScreen() {
  const { colors, spacing, typography, radii } = useAppTheme();
  const { selectedMonth, nextMonth, previousMonth, transactionsVersion } =
    useUIStore();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');

  const filters = useMemo(() => {
    return {
      month: selectedMonth,
      search: search.trim() ? search : undefined,
      type: selectedType === 'all' ? undefined : selectedType,
    };
  }, [selectedMonth, search, selectedType]);

  const {
    dayGroups,
    loading,
    undoItem,
    refresh,
    deleteWithUndo,
    undoDelete,
    dismissUndo,
  } = useTransactions(filters);

  // Refresh whenever screen gains focus or transactions are modified
  useFocusEffect(
    React.useCallback(() => {
      refresh(filters);
    }, [refresh, filters]),
  );

  React.useEffect(() => {
    refresh(filters);
  }, [refresh, filters, transactionsVersion]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            padding: spacing.md,
            borderBottomColor: colors.border,
            borderBottomWidth: 1,
          },
        ]}
      >
        {/* Month Switcher Bar */}
        <View
          style={[
            styles.monthBar,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              borderRadius: radii.md,
              paddingVertical: spacing.xs,
              paddingHorizontal: spacing.sm,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Pressable onPress={previousMonth} hitSlop={12}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.bold,
              }}
            >
              ◀
            </Text>
          </Pressable>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            {formatDisplayMonth(selectedMonth)}
          </Text>
          <Pressable onPress={nextMonth} hitSlop={12}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.bold,
              }}
            >
              ▶
            </Text>
          </Pressable>
        </View>

        <TransactionFiltersBar
          search={search}
          onSearchChange={setSearch}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
        />
      </View>

      {loading && dayGroups.length === 0 ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <SectionList<TransactionWithCategory, DayGroup>
          sections={dayGroups}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => refresh(filters)}
              tintColor={colors.primary}
            />
          }
          renderSectionHeader={({ section }) => {
            const dailyNet = section.totalIncomeCents - section.totalExpenseCents;
            return (
              <View
                style={[
                  styles.sectionHeader,
                  {
                    backgroundColor: colors.background,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.xs + 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sectionDate,
                    {
                      color: colors.textSecondary,
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.bold,
                    },
                  ]}
                >
                  {section.displayDate.toUpperCase()}
                </Text>
                <Text
                  style={[
                    styles.sectionNet,
                    {
                      color:
                        dailyNet > 0
                          ? colors.income
                          : dailyNet < 0
                            ? colors.expense
                            : colors.textMuted,
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.semibold,
                    },
                  ]}
                >
                  {dailyNet > 0 ? '+' : dailyNet < 0 ? '-' : ''}
                  {formatCents(Math.abs(dailyNet))}
                </Text>
              </View>
            );
          }}
          renderItem={({ item }) => (
            <TransactionItem
              transaction={item}
              onPress={() =>
                router.push({
                  pathname: '/modal/transaction',
                  params: { id: item.id.toString() },
                })
              }
              onDelete={() => deleteWithUndo(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title="No transactions found"
              description={
                search
                  ? 'No entries match your search query.'
                  : 'No transactions recorded for this month.'
              }
              actionTitle="+ Add Entry"
              onActionPress={() =>
                router.push({
                  pathname: '/modal/transaction',
                  params: {
                    type: selectedType === 'all' ? undefined : selectedType,
                  },
                })
              }
            />
          }
          contentContainerStyle={{ paddingBottom: spacing.xxxl * 2 }}
        />
      )}

      {/* Floating Action Button for Adding Transaction */}
      <Pressable
        onPress={() =>
          router.push({
            pathname: '/modal/transaction',
            params: {
              type: selectedType === 'all' ? undefined : selectedType,
            },
          })
        }
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            borderRadius: radii.full,
            bottom: spacing.xxl,
            right: spacing.lg,
          },
        ]}
        accessibilityLabel="Add Transaction"
        accessibilityRole="button"
      >
        <Ionicons name="add" size={30} color={colors.textInverse} />
      </Pressable>

      <Snackbar
        visible={Boolean(undoItem)}
        message={`Deleted "${undoItem?.category_name}" entry`}
        actionText="UNDO"
        onAction={undoDelete}
        onDismiss={dismissUndo}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {},
  monthBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
  },
  centerLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionDate: {
    letterSpacing: 0.5,
  },
  sectionNet: {},
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
});

