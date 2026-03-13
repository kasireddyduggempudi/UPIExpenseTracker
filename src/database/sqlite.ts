import SQLite, {SQLiteDatabase, ResultSet} from 'react-native-sqlite-storage';
import {Transaction} from '../models/Transaction';

SQLite.enablePromise(true);

const DATABASE_NAME = 'expense.db';
const DATABASE_LOCATION = 'default';
const TABLE_NAME = 'transactions';

let dbInstance: SQLiteDatabase | null = null;

const getDatabase = async (): Promise<SQLiteDatabase> => {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await SQLite.openDatabase({
    name: DATABASE_NAME,
    location: DATABASE_LOCATION,
  });

  return dbInstance;
};

const mapTransactionRows = (result: ResultSet): Transaction[] => {
  const items: Transaction[] = [];

  for (let i = 0; i < result.rows.length; i += 1) {
    const row = result.rows.item(i);
    items.push({
      id: row.id,
      amount: Number(row.amount),
      category: row.category,
      upiId: row.upiId,
      date: row.date,
      status: row.status,
      txnId: row.txnId ?? undefined,
    });
  }

  return items;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      amount REAL,
      category TEXT,
      upiId TEXT,
      date TEXT,
      status TEXT,
      txnId TEXT
    );`,
  );
};

export const insertTransaction = async (
  transaction: Transaction,
): Promise<void> => {
  const db = await getDatabase();

  await db.executeSql(
    `INSERT OR REPLACE INTO ${TABLE_NAME}
      (id, amount, category, upiId, date, status, txnId)
      VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      transaction.id,
      transaction.amount,
      transaction.category,
      transaction.upiId,
      transaction.date,
      transaction.status,
      transaction.txnId ?? null,
    ],
  );
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT id, amount, category, upiId, date, status, txnId
     FROM ${TABLE_NAME}
     ORDER BY date DESC;`,
  );

  return mapTransactionRows(result);
};

export const getMonthlySpend = async (): Promise<number> => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM ${TABLE_NAME}
     WHERE substr(date, 1, 7) = strftime('%Y-%m', 'now', 'localtime')
       AND status = 'SUCCESS';`,
  );

  const total = result.rows.length > 0 ? Number(result.rows.item(0).total) : 0;
  return Number.isNaN(total) ? 0 : total;
};

export interface CategorySpend {
  category: string;
  total: number;
}

export const getCategorySpend = async (): Promise<CategorySpend[]> => {
  const db = await getDatabase();
  const [result] = await db.executeSql(
    `SELECT category, COALESCE(SUM(amount), 0) AS total
     FROM ${TABLE_NAME}
     WHERE status = 'SUCCESS'
     GROUP BY category
     ORDER BY total DESC;`,
  );

  const items: CategorySpend[] = [];

  for (let i = 0; i < result.rows.length; i += 1) {
    const row = result.rows.item(i);
    items.push({
      category: row.category,
      total: Number(row.total),
    });
  }

  return items;
};
