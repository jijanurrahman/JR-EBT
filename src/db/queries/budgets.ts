import { getDatabase } from '../client';
import { BudgetWithCategory } from '../types';

interface RawBudgetRow {
  id: number;
  category_id: number;
  month: string;
  limit_cents: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  spent_cents: number | null;
}

export async function getBudgetsForMonth(
  month: string,
): Promise<BudgetWithCategory[]> {
  const db = await getDatabase();
  const sql = `
    SELECT 
      b.id,
      b.category_id,
      b.month,
      b.limit_cents,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon,
      COALESCE(spent_sub.spent_cents, 0) AS spent_cents
    FROM budgets b
    INNER JOIN categories c ON b.category_id = c.id
    LEFT JOIN (
      SELECT category_id, SUM(amount_cents) AS spent_cents
      FROM transactions
      WHERE date LIKE ? AND type = 'expense'
      GROUP BY category_id
    ) spent_sub ON b.category_id = spent_sub.category_id
    WHERE b.month = ?
    ORDER BY c.name ASC;
  `;

  const rows = await db.getAllAsync<RawBudgetRow>(sql, [`${month}-%`, month]);

  return rows.map((row) => {
    const spent = row.spent_cents ?? 0;
    const limit = row.limit_cents;
    const remaining = limit - spent;
    const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;

    return {
      id: row.id,
      category_id: row.category_id,
      month: row.month,
      limit_cents: limit,
      category_name: row.category_name,
      category_color: row.category_color,
      category_icon: row.category_icon,
      spent_cents: spent,
      remaining_cents: remaining,
      percentage,
    };
  });
}

export async function upsertBudget(
  categoryId: number,
  month: string,
  limitCents: number,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO budgets (category_id, month, limit_cents)
     VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET limit_cents = excluded.limit_cents;`,
    [categoryId, month, limitCents],
  );
  return result.lastInsertRowId;
}

export async function deleteBudget(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM budgets WHERE id = ?;', [id]);
}

export async function copyBudgetsFromPreviousMonth(
  fromMonth: string,
  toMonth: string,
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO budgets (category_id, month, limit_cents)
     SELECT category_id, ?, limit_cents
     FROM budgets
     WHERE month = ?;`,
    [toMonth, fromMonth],
  );
  return result.changes;
}

