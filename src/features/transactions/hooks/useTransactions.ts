import { useCallback, useEffect, useRef, useState } from 'react';
import {
  deleteTransaction,
  getTransactions,
  TransactionFilters,
} from '@/db/queries';
import { TransactionWithCategory } from '@/db/types';
import { formatDisplayDate } from '@/lib/dates';

export interface DayGroup {
  date: string;
  displayDate: string;
  data: TransactionWithCategory[];
  totalIncomeCents: number;
  totalExpenseCents: number;
}

export function useTransactions(initialFilters: TransactionFilters = {}) {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoItem, setUndoItem] = useState<TransactionWithCategory | null>(null);

  const pendingDeleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDeleteItemRef = useRef<TransactionWithCategory | null>(null);

  const fetchTransactions = useCallback(
    async (filters: TransactionFilters = initialFilters) => {
      try {
        setLoading(true);
        const data = await getTransactions(filters);
        setTransactions(data);
      } catch (err) {
        console.warn('Failed to fetch transactions:', err);
      } finally {
        setLoading(false);
      }
    },
    [initialFilters.month, initialFilters.type, initialFilters.search],
  );

  useEffect(() => {
    fetchTransactions(initialFilters);
  }, [fetchTransactions, initialFilters]);

  // Clean up any pending timer on unmount
  useEffect(() => {
    return () => {
      if (pendingDeleteTimeoutRef.current && pendingDeleteItemRef.current) {
        deleteTransaction(pendingDeleteItemRef.current.id).catch(() => {});
      }
    };
  }, []);

  const deleteWithUndo = useCallback(
    (item: TransactionWithCategory) => {
      // If there is an existing pending delete, execute it immediately
      if (pendingDeleteTimeoutRef.current && pendingDeleteItemRef.current) {
        clearTimeout(pendingDeleteTimeoutRef.current);
        deleteTransaction(pendingDeleteItemRef.current.id).catch(() => {});
      }

      // Optimistically remove from state
      setTransactions((prev) => prev.filter((t) => t.id !== item.id));
      setUndoItem(item);
      pendingDeleteItemRef.current = item;

      pendingDeleteTimeoutRef.current = setTimeout(async () => {
        try {
          await deleteTransaction(item.id);
        } catch (err) {
          console.warn('Error deleting transaction from SQLite:', err);
        } finally {
          pendingDeleteItemRef.current = null;
          setUndoItem(null);
        }
      }, 4000);
    },
    [],
  );

  const undoDelete = useCallback(() => {
    if (pendingDeleteTimeoutRef.current) {
      clearTimeout(pendingDeleteTimeoutRef.current);
      pendingDeleteTimeoutRef.current = null;
    }

    if (pendingDeleteItemRef.current) {
      const restored = pendingDeleteItemRef.current;
      setTransactions((prev) => {
        const next = [restored, ...prev];
        return next.sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
      });
      pendingDeleteItemRef.current = null;
    }

    setUndoItem(null);
  }, []);

  const dismissUndo = useCallback(() => {
    if (pendingDeleteTimeoutRef.current && pendingDeleteItemRef.current) {
      clearTimeout(pendingDeleteTimeoutRef.current);
      const itemToDelete = pendingDeleteItemRef.current;
      deleteTransaction(itemToDelete.id).catch(() => {});
      pendingDeleteItemRef.current = null;
    }
    setUndoItem(null);
  }, []);

  // Group by date
  const dayGroups: DayGroup[] = transactions.reduce<DayGroup[]>((acc, item) => {
    let group = acc.find((g) => g.date === item.date);
    if (!group) {
      group = {
        date: item.date,
        displayDate: formatDisplayDate(item.date),
        data: [],
        totalIncomeCents: 0,
        totalExpenseCents: 0,
      };
      acc.push(group);
    }
    group.data.push(item);
    if (item.type === 'income') {
      group.totalIncomeCents += item.amount_cents;
    } else {
      group.totalExpenseCents += item.amount_cents;
    }
    return acc;
  }, []);

  return {
    transactions,
    dayGroups,
    loading,
    undoItem,
    refresh: fetchTransactions,
    deleteWithUndo,
    undoDelete,
    dismissUndo,
  };
}
