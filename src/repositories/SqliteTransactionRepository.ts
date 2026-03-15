import SQLite, {SQLiteDatabase} from 'react-native-sqlite-storage';
import {Transaction} from '../models/Transaction';
import {
  CategorySummary,
  MonthlySummary,
  YearlySummary,
} from '../models/Summary';
import {ITransactionRepository} from './ITransactionRepository';
import {CATEGORIES} from '../utils/constants';
import {monthLabel, padMonth, generateId} from '../utils/dateUtils';

SQLite.enablePromise(true);

const DB_NAME = 'dkledger.db';
const TABLE = 'expenses';
const SETTINGS_TABLE = 'app_settings';
const BUDGET_ALERT_TABLE = 'budget_alert_state';
const MONTHLY_LIMIT_KEY = 'monthly_limit';

export class SqliteTransactionRepository implements ITransactionRepository {
  private db: SQLiteDatabase | null = null;

  private async getDb(): Promise<SQLiteDatabase> {
    if (!this.db) {
      this.db = await SQLite.openDatabase({name: DB_NAME, location: 'default'});
    }
    return this.db;
  }

  async init(): Promise<void> {
    const db = await this.getDb();
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS ${TABLE} (
        id          TEXT PRIMARY KEY,
        amount      REAL    NOT NULL,
        category    TEXT    NOT NULL,
        customCategory TEXT,
        note        TEXT,
        date        TEXT    NOT NULL,
        createdAt   TEXT    NOT NULL
      );
    `);
    // Index for fast date-range queries
    await db.executeSql(`
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON ${TABLE}(date);
    `);
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS ${BUDGET_ALERT_TABLE} (
        monthKey  TEXT PRIMARY KEY,
        alerted80 INTEGER NOT NULL DEFAULT 0,
        alerted100 INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  async add(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const db = await this.getDb();
    const record: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await db.executeSql(
      `INSERT INTO ${TABLE} (id, amount, category, customCategory, note, date, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,
      [
        record.id,
        record.amount,
        record.category,
        record.customCategory ?? null,
        record.note ?? null,
        record.date,
        record.createdAt,
      ],
    );
    return record;
  }

  async update(
    id: string,
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ): Promise<Transaction> {
    const db = await this.getDb();

    const [existingResult] = await db.executeSql(
      `SELECT createdAt FROM ${TABLE} WHERE id = ? LIMIT 1;`,
      [id],
    );

    if (existingResult.rows.length === 0) {
      throw new Error('Expense not found');
    }

    const createdAt = existingResult.rows.item(0).createdAt as string;

    await db.executeSql(
      `UPDATE ${TABLE}
       SET amount = ?, category = ?, customCategory = ?, note = ?, date = ?
       WHERE id = ?;`,
      [
        data.amount,
        data.category,
        data.customCategory ?? null,
        data.note ?? null,
        data.date,
        id,
      ],
    );

    return {
      ...data,
      id,
      createdAt,
    };
  }

  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const db = await this.getDb();
    const prefix = `${year}-${padMonth(month)}`;
    const [result] = await db.executeSql(
      `SELECT * FROM ${TABLE} WHERE substr(date,1,7) = ? ORDER BY date DESC, createdAt DESC;`,
      [prefix],
    );
    const rows: Transaction[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const r = result.rows.item(i);
      rows.push({
        id: r.id,
        amount: Number(r.amount),
        category: r.category,
        customCategory: r.customCategory ?? undefined,
        note: r.note ?? undefined,
        date: r.date,
        createdAt: r.createdAt,
      });
    }
    return rows;
  }

  async getMonthlySummaries(months: number): Promise<MonthlySummary[]> {
    const db = await this.getDb();

    // Build the oldest YYYY-MM we want
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
    const fromPrefix = `${from.getFullYear()}-${padMonth(from.getMonth() + 1)}`;

    const [result] = await db.executeSql(
      `SELECT substr(date,1,7) as ym, category, SUM(amount) as total, COUNT(*) as cnt
       FROM ${TABLE}
       WHERE substr(date,1,7) >= ?
       GROUP BY ym, category
       ORDER BY ym DESC;`,
      [fromPrefix],
    );

    // Aggregate into a map keyed by 'YYYY-MM'
    const map: Record<
      string,
      {cats: Record<string, {total: number; count: number}>}
    > = {};
    for (let i = 0; i < result.rows.length; i++) {
      const r = result.rows.item(i);
      if (!map[r.ym]) {
        map[r.ym] = {cats: {}};
      }
      map[r.ym].cats[r.category] = {
        total: Number(r.total),
        count: Number(r.cnt),
      };
    }

    // Build the ordered list of months (newest first), filling gaps with zeros
    const summaries: MonthlySummary[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const ym = `${yr}-${padMonth(mo)}`;
      const cats = map[ym]?.cats ?? {};

      const categories: CategorySummary[] = CATEGORIES.filter(
        c => cats[c.id] !== undefined,
      ).map(c => ({
        categoryId: c.id,
        categoryLabel: c.label,
        color: c.color,
        total: cats[c.id]?.total ?? 0,
        count: cats[c.id]?.count ?? 0,
      }));

      summaries.push({
        year: yr,
        month: mo,
        label: monthLabel(yr, mo),
        categories,
        total: categories.reduce((s, c) => s + c.total, 0),
      });
    }

    return summaries.filter(summary => summary.total > 0);
  }

  async getYearlySummaries(years: number): Promise<YearlySummary[]> {
    const db = await this.getDb();
    const currentYear = new Date().getFullYear();
    const fromYear = currentYear - (years - 1);

    const [result] = await db.executeSql(
      `SELECT substr(date,1,4) as yr, category, SUM(amount) as total, COUNT(*) as cnt
       FROM ${TABLE}
       WHERE CAST(substr(date,1,4) AS INTEGER) >= ?
       GROUP BY yr, category
       ORDER BY yr DESC;`,
      [fromYear],
    );

    const map: Record<
      string,
      Record<string, {total: number; count: number}>
    > = {};
    for (let i = 0; i < result.rows.length; i++) {
      const r = result.rows.item(i);
      if (!map[r.yr]) {
        map[r.yr] = {};
      }
      map[r.yr][r.category] = {total: Number(r.total), count: Number(r.cnt)};
    }

    const summaries: YearlySummary[] = [];
    for (let i = 0; i < years; i++) {
      const yr = currentYear - i;
      const cats = map[String(yr)] ?? {};

      const categories: CategorySummary[] = CATEGORIES.filter(
        c => cats[c.id] !== undefined,
      ).map(c => ({
        categoryId: c.id,
        categoryLabel: c.label,
        color: c.color,
        total: cats[c.id]?.total ?? 0,
        count: cats[c.id]?.count ?? 0,
      }));

      summaries.push({
        year: yr,
        categories,
        total: categories.reduce((s, c) => s + c.total, 0),
      });
    }

    return summaries.filter(summary => summary.total > 0);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.executeSql(`DELETE FROM ${TABLE} WHERE id = ?;`, [id]);
  }

  async getMonthlyLimit(): Promise<number | null> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      `SELECT value FROM ${SETTINGS_TABLE} WHERE key = ? LIMIT 1;`,
      [MONTHLY_LIMIT_KEY],
    );
    if (result.rows.length === 0) {
      return null;
    }
    const raw = result.rows.item(0).value;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  async setMonthlyLimit(limit: number | null): Promise<void> {
    const db = await this.getDb();
    if (limit === null || !Number.isFinite(limit) || limit <= 0) {
      await db.executeSql(`DELETE FROM ${SETTINGS_TABLE} WHERE key = ?;`, [
        MONTHLY_LIMIT_KEY,
      ]);
      return;
    }

    await db.executeSql(
      `INSERT OR REPLACE INTO ${SETTINGS_TABLE} (key, value) VALUES (?, ?);`,
      [MONTHLY_LIMIT_KEY, String(limit)],
    );
  }

  async getMonthTotal(year: number, month: number): Promise<number> {
    const db = await this.getDb();
    const prefix = `${year}-${padMonth(month)}`;
    const [result] = await db.executeSql(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM ${TABLE}
       WHERE substr(date,1,7) = ?;`,
      [prefix],
    );
    return Number(result.rows.item(0).total ?? 0);
  }

  async getBudgetAlertState(
    monthKey: string,
  ): Promise<{alerted80: boolean; alerted100: boolean}> {
    const db = await this.getDb();
    const [result] = await db.executeSql(
      `SELECT alerted80, alerted100 FROM ${BUDGET_ALERT_TABLE} WHERE monthKey = ? LIMIT 1;`,
      [monthKey],
    );

    if (result.rows.length === 0) {
      return {alerted80: false, alerted100: false};
    }

    const row = result.rows.item(0);
    return {
      alerted80: Number(row.alerted80) === 1,
      alerted100: Number(row.alerted100) === 1,
    };
  }

  async setBudgetAlertState(
    monthKey: string,
    state: {alerted80: boolean; alerted100: boolean},
  ): Promise<void> {
    const db = await this.getDb();
    await db.executeSql(
      `INSERT OR REPLACE INTO ${BUDGET_ALERT_TABLE} (monthKey, alerted80, alerted100)
       VALUES (?, ?, ?);`,
      [monthKey, state.alerted80 ? 1 : 0, state.alerted100 ? 1 : 0],
    );
  }
}

// Singleton — keeps one open DB connection for the lifetime of the app
export const sqliteRepository = new SqliteTransactionRepository();
