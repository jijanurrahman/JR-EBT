export type TransactionType = 'income' | 'expense';
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  is_default: number; // 0 or 1
  archived: number; // 0 or 1
}

export interface NewCategory {
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  is_default?: number;
  archived?: number;
}

export interface UpdateCategory {
  name?: string;
  color?: string;
  icon?: string;
  archived?: number;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount_cents: number;
  category_id: number;
  note: string | null;
  date: string; // 'YYYY-MM-DD'
  recurring_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface NewTransaction {
  type: TransactionType;
  amount_cents: number;
  category_id: number;
  note?: string | null;
  date: string;
  recurring_id?: number | null;
}

export interface UpdateTransaction {
  type?: TransactionType;
  amount_cents?: number;
  category_id?: number;
  note?: string | null;
  date?: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string; // 'YYYY-MM'
  limit_cents: number;
}

export interface BudgetWithCategory extends Budget {
  category_name: string;
  category_color: string;
  category_icon: string;
  spent_cents: number;
  remaining_cents: number;
  percentage: number;
}

export interface RecurringRule {
  id: number;
  type: TransactionType;
  amount_cents: number;
  category_id: number;
  note: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: string; // 'YYYY-MM-DD'
  end_date: string | null; // 'YYYY-MM-DD' or null
  last_generated_date: string | null; // 'YYYY-MM-DD' or null
  active: number; // 0 or 1
}

export interface RecurringRuleWithCategory extends RecurringRule {
  category_name: string;
  category_color: string;
  category_icon: string;
}

export interface NewRecurringRule {
  type: TransactionType;
  amount_cents: number;
  category_id: number;
  note?: string | null;
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: string;
  end_date?: string | null;
  active?: number;
}

export interface UpdateRecurringRule {
  type?: TransactionType;
  amount_cents?: number;
  category_id?: number;
  note?: string | null;
  frequency?: RecurrenceFrequency;
  interval?: number;
  start_date?: string;
  end_date?: string | null;
  last_generated_date?: string | null;
  active?: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface MonthlySummary {
  income_cents: number;
  expense_cents: number;
  net_cents: number;
}

export interface CategoryBreakdown {
  category_id: number;
  category_name: string;
  category_color: string;
  total_cents: number;
}

export interface MonthlyTrend {
  month: string;
  income_cents: number;
  expense_cents: number;
}
