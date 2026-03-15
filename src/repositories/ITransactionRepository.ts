import {Transaction} from '../models/Transaction';
import {MonthlySummary, YearlySummary} from '../models/Summary';

/**
 * Abstract data-access contract.
 *
 * Swap this for an API implementation with no changes in screens or services:
 *   class ApiTransactionRepository implements ITransactionRepository { ... }
 */
export interface ITransactionRepository {
  /** Called once at app startup — creates tables, runs migrations, etc. */
  init(): Promise<void>;

  /** Persist a new expense and return the saved record (with id + createdAt). */
  add(data: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction>;

  /** All transactions for a specific calendar month (month is 1-based). */
  getByMonth(year: number, month: number): Promise<Transaction[]>;

  /**
   * Category-level summaries for every month in the last `months` calendar
   * months (including the current month), newest first.
   */
  getMonthlySummaries(months: number): Promise<MonthlySummary[]>;

  /**
   * Category-level summaries for every year in the last `years` calendar
   * years (including the current year), newest first.
   */
  getYearlySummaries(years: number): Promise<YearlySummary[]>;

  /** Hard-delete a single transaction by id. */
  delete(id: string): Promise<void>;
}
