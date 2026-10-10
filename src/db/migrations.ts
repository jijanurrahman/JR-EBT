import { SQLiteDatabase } from 'expo-sqlite';

interface UserVersionRow {
  user_version: number;
}

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<UserVersionRow>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion < 1) {
    await db.withTransactionAsync(async () => {
      // 1. Categories table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          color TEXT NOT NULL,
          icon TEXT NOT NULL,
          is_default INTEGER NOT NULL DEFAULT 0,
          archived INTEGER NOT NULL DEFAULT 0,
          UNIQUE (name, type)
        );
      `);

      // 2. Transactions table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          note TEXT,
          date TEXT NOT NULL,
          recurring_id INTEGER REFERENCES recurring_rules(id) ON DELETE SET NULL,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
      `);

      // 3. Budgets table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          month TEXT NOT NULL,
          limit_cents INTEGER NOT NULL CHECK (limit_cents > 0),
          UNIQUE (category_id, month)
        );
      `);

      // 4. Recurring rules table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS recurring_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          note TEXT,
          frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
          interval INTEGER NOT NULL DEFAULT 1 CHECK (interval > 0),
          start_date TEXT NOT NULL,
          end_date TEXT,
          last_generated_date TEXT,
          active INTEGER NOT NULL DEFAULT 1
        );
      `);

      // 5. Settings table
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);

      // 6. Indexes
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
        CREATE INDEX IF NOT EXISTS idx_transactions_category_date ON transactions(category_id, date);
        CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_date ON transactions(recurring_id, date) WHERE recurring_id IS NOT NULL;
      `);

      // 7. Seed categories
      const defaultCategories: Array<[string, 'income' | 'expense', string, string]> = [
        ['Salary', 'income', '#16A34A', 'cash-outline'],
        ['Freelance', 'income', '#0D9488', 'laptop-outline'],
        ['Investments', 'income', '#2563EB', 'trending-up-outline'],
        ['Other Income', 'income', '#64748B', 'wallet-outline'],
        ['Food & Dining', 'expense', '#EA580C', 'restaurant-outline'],
        ['Rent & Housing', 'expense', '#7C3AED', 'home-outline'],
        ['Transportation', 'expense', '#2563EB', 'car-outline'],
        ['Bills & Utilities', 'expense', '#CA8A04', 'flash-outline'],
        ['Health & Medical', 'expense', '#E11D48', 'medkit-outline'],
        ['Shopping', 'expense', '#DB2777', 'cart-outline'],
        ['Entertainment', 'expense', '#9333EA', 'film-outline'],
        ['Other Expense', 'expense', '#64748B', 'ellipsis-horizontal-circle-outline'],
      ];

      for (const [name, type, color, icon] of defaultCategories) {
        await db.runAsync(
          `INSERT OR IGNORE INTO categories (name, type, color, icon, is_default, archived) VALUES (?, ?, ?, ?, 1, 0);`,
          [name, type, color, icon],
        );
      }

      // 8. Seed default settings
      const defaultSettings: Array<[string, string]> = [
        ['currency', 'USD'],
        ['lock_enabled', '0'],
        ['lock_delay', '0'],
      ];

      for (const [key, value] of defaultSettings) {
        await db.runAsync(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?);`, [
          key,
          value,
        ]);
      }

      await db.execAsync('PRAGMA user_version = 1;');
    });
  }
}

