import { getDatabase } from '../client';
import { Category, NewCategory, UpdateCategory, TransactionType } from '../types';

export async function getAllCategories(
  type?: TransactionType,
  includeArchived = false,
): Promise<Category[]> {
  const db = await getDatabase();
  const conditions: string[] = [];
  const params: (string | number)[] = [];

  if (type) {
    conditions.push('type = ?');
    params.push(type);
  }

  if (!includeArchived) {
    conditions.push('archived = 0');
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sql = `SELECT * FROM categories ${whereClause} ORDER BY name ASC;`;

  return db.getAllAsync<Category>(sql, params);
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Category>('SELECT * FROM categories WHERE id = ?;', [id]);
}

export async function createCategory(cat: NewCategory): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT INTO categories (name, type, color, icon, is_default, archived) VALUES (?, ?, ?, ?, ?, ?);`,
    [
      cat.name.trim(),
      cat.type,
      cat.color,
      cat.icon,
      cat.is_default ?? 0,
      cat.archived ?? 0,
    ],
  );
  return result.lastInsertRowId;
}

export async function updateCategory(id: number, data: UpdateCategory): Promise<void> {
  const db = await getDatabase();
  const fields: string[] = [];
  const params: (string | number)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name.trim());
  }
  if (data.color !== undefined) {
    fields.push('color = ?');
    params.push(data.color);
  }
  if (data.icon !== undefined) {
    fields.push('icon = ?');
    params.push(data.icon);
  }
  if (data.archived !== undefined) {
    fields.push('archived = ?');
    params.push(data.archived);
  }

  if (fields.length === 0) return;

  params.push(id);
  await db.runAsync(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?;`, params);
}

export async function archiveCategory(id: number, archived: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE categories SET archived = ? WHERE id = ?;', [
    archived ? 1 : 0,
    id,
  ]);
}

export async function deleteCategory(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
}

