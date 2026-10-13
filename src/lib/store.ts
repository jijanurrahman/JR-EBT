import { create } from 'zustand';
import { getCurrentMonth, getNextMonth, getPreviousMonth } from './dates';

interface UIState {
  selectedMonth: string; // 'YYYY-MM'
  setSelectedMonth: (month: string) => void;
  nextMonth: () => void;
  previousMonth: () => void;
  isAppLocked: boolean;
  setIsAppLocked: (locked: boolean) => void;
  transactionsVersion: number;
  bumpTransactionsVersion: () => void;
  currency: string;
  currencySymbol: string;
  setCurrency: (code: string, symbol?: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: getCurrentMonth(),
  setSelectedMonth: (month: string) => set({ selectedMonth: month }),
  nextMonth: () =>
    set((state) => ({ selectedMonth: getNextMonth(state.selectedMonth) })),
  previousMonth: () =>
    set((state) => ({ selectedMonth: getPreviousMonth(state.selectedMonth) })),
  isAppLocked: false,
  setIsAppLocked: (locked: boolean) => set({ isAppLocked: locked }),
  transactionsVersion: 0,
  bumpTransactionsVersion: () =>
    set((state) => ({ transactionsVersion: state.transactionsVersion + 1 })),
  currency: 'USD',
  currencySymbol: '$',
  setCurrency: (code: string, symbol = '$') =>
    set({ currency: code, currencySymbol: symbol }),
}));

