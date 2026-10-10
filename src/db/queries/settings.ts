import { getDatabase } from '../client';
import { Setting } from '../types';

export async function getSetting(key: string, defaultValue = ''): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<Setting>(
    'SELECT key, value FROM settings WHERE key = ?;',
    [key],
  );
  return row?.value ?? defaultValue;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value;`,
    [key, value],
  );
}

