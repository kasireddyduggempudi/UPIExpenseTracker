/**
 * TransactionService
 *
 * Thin business-logic layer that all screens call.
 * Uses ITransactionRepository — swap `activeRepository` to point at
 * an API-backed implementation and nothing else changes in screens.
 */
import {ITransactionRepository} from '../repositories/ITransactionRepository';
import {sqliteRepository} from '../repositories/SqliteTransactionRepository';
import {Transaction} from '../models/Transaction';
import {MonthlySummary, YearlySummary} from '../models/Summary';

// ─── Swap here to use a remote API ────────────────────────────────────────────
// import {apiRepository} from '../repositories/ApiTransactionRepository';
// const activeRepository: ITransactionRepository = apiRepository;
const activeRepository: ITransactionRepository = sqliteRepository;
// ──────────────────────────────────────────────────────────────────────────────

export async function initTransactionService(): Promise<void> {
  await activeRepository.init();
}

/** Alias for backward-compat with AppNavigator init call */
export const initializeTransactionStore = initTransactionService;

export async function addExpense(
  data: Omit<Transaction, 'id' | 'createdAt'>,
): Promise<Transaction> {
  return activeRepository.add(data);
}

export async function getTransactionsByMonth(
  year: number,
  month: number,
): Promise<Transaction[]> {
  return activeRepository.getByMonth(year, month);
}

/** Monthly summaries for the last 24 months, newest first. */
export async function getLast2YearsMonthlySummaries(): Promise<
  MonthlySummary[]
> {
  return activeRepository.getMonthlySummaries(24);
}

/** Yearly summaries for the last 5 years, newest first. */
export async function getLast5YearsYearlySummaries(): Promise<YearlySummary[]> {
  return activeRepository.getYearlySummaries(5);
}

export async function deleteExpense(id: string): Promise<void> {
  return activeRepository.delete(id);
}
