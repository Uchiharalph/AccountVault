import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("accountvault.db");

export const initLocalDB = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      website_url TEXT,
      email_used TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Other',
      login_method TEXT NOT NULL DEFAULT 'Email/Password',
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );
  `);
};

export const saveAccountLocally = (account: {
  id: string;
  user_id: string;
  name: string;
  website_url?: string;
  email_used: string;
  category: string;
  login_method: string;
  notes?: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  synced?: number;
}) => {
  db.runSync(
    `INSERT OR REPLACE INTO accounts 
    (id, user_id, name, website_url, email_used, category, login_method, notes, is_active, last_used_at, created_at, synced)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      account.id,
      account.user_id,
      account.name,
      account.website_url || null,
      account.email_used,
      account.category,
      account.login_method,
      account.notes || null,
      account.is_active ? 1 : 0,
      account.last_used_at || null,
      account.created_at,
      account.synced ?? 0,
    ],
  );
};

export const getAllLocalAccounts = () => {
  const rows = db.getAllSync("SELECT * FROM accounts ORDER BY created_at DESC");
  return rows.map((row: any) => ({
    ...row,
    is_active: row.is_active === 1,
    website_url: row.website_url || undefined,
    notes: row.notes || undefined,
    last_used_at: row.last_used_at || undefined,
  }));
};

export const getUnsyncedAccounts = () => {
  return db.getAllSync("SELECT * FROM accounts WHERE synced = 0");
};

export const markAsSynced = (id: string) => {
  db.runSync("UPDATE accounts SET synced = 1 WHERE id = ?", [id]);
};

export const deleteAccountLocally = (id: string) => {
  db.runSync("DELETE FROM accounts WHERE id = ?", [id]);
};

export const updateAccountLocally = (
  id: string,
  updates: Record<string, any>,
) => {
  const fields = Object.keys(updates)
    .map((k) => `${k} = ?`)
    .join(", ");
  const values = Object.values(updates);
  db.runSync(`UPDATE accounts SET ${fields} WHERE id = ?`, [...values, id]);
};
