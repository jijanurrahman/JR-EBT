import { getDatabase } from '../client';
import {
  TransactionWithCategory,
  NewTransaction,
  UpdateTransaction,
  TransactionType,
  MonthlySummary,
  CategoryBreakdown,
  MonthlyTrend,
} from '../types';

export interface TransactionFilters {
  month?: string; // 'YYYY-MM'
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string; // 'YYYY-MM-DD'
  type?: TransactionType;
  categoryId?: number;
  search?: string;
}

export async function getTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionWithCategory[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (filters.month) {
    conditions.push('t.date LIKE ?');
    params.push(`${filters.month}-%`);
  }

  if (filters.startDate) {
    conditions.push('t.date >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push('t.date <= ?');
    params.push(filters.endDate);
  }

  if (filters.type) {
    conditions.push('t.type = ?');
    params.push(filters.type);
  }

  if (filters.categoryId) {
    conditions.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.search) {
    conditions.push('(t.note LIKE ? OR c.name LIKE ?)');
    const searchTerm = `%${filters.search.trim()}%`;
    params.push(searchTerm, searchTerm);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `
    SELECT 
      t.id,
      t.type,
      t.amount_cents,
      t.category_id,
      t.note,
      t.date,
      t.recurring_id,
      t.created_at,
      t.updated_at,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon
    FROM transactions t
    INNER JOIN categories c ON t.category_id = c.id
    ${whereClause}
    ORDER BY t.date DESC, t.id DESC;
  `;

  return db.getAllAsync<TransactionWithCategory>(sql, params);
}

export async function getTransactionById(
  id: number,
): Promise<TransactionWithCategory | null> {
  const db = await getDatabase();
  const sql = `
    SELECT 
      t.id,
      t.type,
      t.amount_cents,
      t.category_id,
      t.note,
      t.date,
      t.recurring_id,
      t.created_at,
      t.updated_at,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon
    FROM transactions t
    INNER JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?;
  `;
  return db.getFirstAsync<TransactionWithCategory>(sql, [id]);
}

export async function createTransaction(tx: NewTransaction): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO transactions (type, amount_cents, category_id, note, date, recurring_id) 
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      tx.type,
      tx.amount_cents,
      tx.category_id,
      tx.note?.trim() || null,
      tx.date,
      tx.recurring_id ?? null,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateTransaction(
  id: number,
  data: UpdateTransaction,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = ['updated_at = datetime("now")'];
  const params: (string | number | null)[] = [];

  if (data.type !== undefined) {
    fields.push('type = ?');
    params.push(data.type);
  }
  if (data.amount_cents !== undefined) {
    fields.push('amount_cents = ?');
    params.push(data.amount_cents);
  }
  if (data.category_id !== undefined) {
    fields.push('category_id = ?');
    params.push(data.category_id);
  }
  if (data.note !== undefined) {
    fields.push('note = ?');
    params.push(data.note ? data.note.trim() : null);
  }
  if (data.date !== undefined) {
    fields.push('date = ?');
    params.push(data.date);
  }

  params.push(id);
  await db.runAsync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?;`, params);
}

export async function deleteTransaction(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?;', [id]);
}

export async function getMonthlySummary(month: string): Promise<MonthlySummary> {
  const db = await getDatabase();
  const sql = `
    SELECT 
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount_cents ELSE 0 END), 0) AS income_cents,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_cents ELSE 0 END), 0) AS expense_cents
    FROM transactions
    WHERE date LIKE ?;
  `;

  interface SummaryRow {
    income_cents: number;
    expense_cents: number;
  }

  const row = await db.getFirstAsync<SummaryRow>(sql, [`${month}-%`]);
  const income_cents = row?.income_cents ?? 0;
  const expense_cents = row?.expense_cents ?? 0;

  return {
    income_cents,
    expense_cents,
    net_cents: income_cents - expense_cents,
  };
}


export async function getExpenseBreakdownByCategory(
  month: string,
): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const sql = `
    SELECT
      t.category_id,
      c.name AS category_name,
      c.color AS category_color,
      SUM(t.amount_cents) AS total_cents
    FROM transactions t
    INNER JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND t.date LIKE ?
    GROUP BY t.category_id
    ORDER BY total_cents DESC;
  `;
  return db.getAllAsync<CategoryBreakdown>(sql, [`${month}-%`]);
}

export async function getIncomeBreakdownByCategory(
  month: string,
): Promise<CategoryBreakdown[]> {
  const db = await getDatabase();
  const sql = `
    SELECT
      t.category_id,
      c.name AS category_name,
      c.color AS category_color,
      SUM(t.amount_cents) AS total_cents
    FROM transactions t
    INNER JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'income' AND t.date LIKE ?
    GROUP BY t.category_id
    ORDER BY total_cents DESC;
  `;
  return db.getAllAsync<CategoryBreakdown>(sql, [`${month}-%`]);
}

export async function getMonthlyTrend(
  months: string[],
): Promise<MonthlyTrend[]> {
  const results: MonthlyTrend[] = [];

  for (const month of months) {
    const summary = await getMonthlySummary(month);
    results.push({
      month,
      income_cents: summary.income_cents,
      expense_cents: summary.expense_cents,
    });
  }

  return results;
}
