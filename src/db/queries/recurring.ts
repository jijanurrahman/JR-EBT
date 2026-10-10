import { getDatabase } from '../client';
import {
  RecurringRuleWithCategory,
  NewRecurringRule,
  UpdateRecurringRule,
} from '../types';

export async function getAllRecurringRules(
  activeOnly = false,
): Promise<RecurringRuleWithCategory[]> {
  const db = await getDatabase();
  const whereClause = activeOnly ? 'WHERE r.active = 1' : '';
  const sql = `
    SELECT 
      r.id,
      r.type,
      r.amount_cents,
      r.category_id,
      r.note,
      r.frequency,
      r.interval,
      r.start_date,
      r.end_date,
      r.last_generated_date,
      r.active,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon
    FROM recurring_rules r
    INNER JOIN categories c ON r.category_id = c.id
    ${whereClause}
    ORDER BY r.id DESC;
  `;

  return db.getAllAsync<RecurringRuleWithCategory>(sql);
}

export async function getRecurringRuleById(
  id: number,
): Promise<RecurringRuleWithCategory | null> {
  const db = await getDatabase();
  const sql = `
    SELECT 
      r.id,
      r.type,
      r.amount_cents,
      r.category_id,
      r.note,
      r.frequency,
      r.interval,
      r.start_date,
      r.end_date,
      r.last_generated_date,
      r.active,
      c.name AS category_name,
      c.color AS category_color,
      c.icon AS category_icon
    FROM recurring_rules r
    INNER JOIN categories c ON r.category_id = c.id
    WHERE r.id = ?;
  `;

  return db.getFirstAsync<RecurringRuleWithCategory>(sql, [id]);
}

export async function createRecurringRule(rule: NewRecurringRule): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO recurring_rules 
       (type, amount_cents, category_id, note, frequency, interval, start_date, end_date, active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      rule.type,
      rule.amount_cents,
      rule.category_id,
      rule.note?.trim() || null,
      rule.frequency,
      rule.interval,
      rule.start_date,
      rule.end_date || null,
      rule.active ?? 1,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateRecurringRule(
  id: number,
  data: UpdateRecurringRule,
): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
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
  if (data.frequency !== undefined) {
    fields.push('frequency = ?');
    params.push(data.frequency);
  }
  if (data.interval !== undefined) {
    fields.push('interval = ?');
    params.push(data.interval);
  }
  if (data.start_date !== undefined) {
    fields.push('start_date = ?');
    params.push(data.start_date);
  }
  if (data.end_date !== undefined) {
    fields.push('end_date = ?');
    params.push(data.end_date || null);
  }
  if (data.last_generated_date !== undefined) {
    fields.push('last_generated_date = ?');
    params.push(data.last_generated_date || null);
  }
  if (data.active !== undefined) {
    fields.push('active = ?');
    params.push(data.active);
  }

  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(`UPDATE recurring_rules SET ${fields.join(', ')} WHERE id = ?;`, params);
}

export async function deleteRecurringRule(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recurring_rules WHERE id = ?;', [id]);
}

