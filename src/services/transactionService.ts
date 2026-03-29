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
import {Category} from '../utils/constants';

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

export async function updateExpense(
  id: string,
  data: Omit<Transaction, 'id' | 'createdAt'>,
): Promise<Transaction> {
  return activeRepository.update(id, data);
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

export async function getCategories(): Promise<Category[]> {
  return activeRepository.getCategories();
}

export async function addCategory(
  data: Omit<Category, 'id'>,
): Promise<Category> {
  return activeRepository.addCategory(data);
}

export async function updateCategory(
  id: string,
  data: Omit<Category, 'id'>,
): Promise<Category> {
  return activeRepository.updateCategory(id, data);
}

export async function deleteCategory(id: string): Promise<void> {
  return activeRepository.deleteCategory(id);
}

export async function reorderCategories(categoryIds: string[]): Promise<void> {
  return activeRepository.reorderCategories(categoryIds);
}

const getMonthKey = (date: string): string => date.slice(0, 7);

const parseMonthFromDate = (date: string): {year: number; month: number} => {
  const [yearStr, monthStr] = date.split('-');
  return {
    year: Number(yearStr),
    month: Number(monthStr),
  };
};

export async function getMonthlyLimit(): Promise<number | null> {
  return activeRepository.getMonthlyLimit();
}

export async function setMonthlyLimit(limit: number | null): Promise<void> {
  return activeRepository.setMonthlyLimit(limit);
}

export interface BudgetThresholdEvent {
  level: 80 | 100;
  total: number;
  limit: number;
}

/**
 * Checks current month spend against configured budget and emits a single
 * threshold event when 80% or 100% is reached for the first time in that month.
 */
export async function evaluateBudgetThreshold(
  date: string,
): Promise<BudgetThresholdEvent | null> {
  const limit = await activeRepository.getMonthlyLimit();
  if (!limit || limit <= 0) {
    return null;
  }

  const {year, month} = parseMonthFromDate(date);
  const monthKey = getMonthKey(date);
  const total = await activeRepository.getMonthTotal(year, month);
  const pct = (total / limit) * 100;
  const state = await activeRepository.getBudgetAlertState(monthKey);

  if (pct >= 100 && !state.alerted100) {
    await activeRepository.setBudgetAlertState(monthKey, {
      alerted80: true,
      alerted100: true,
    });
    return {level: 100, total, limit};
  }

  if (pct >= 80 && !state.alerted80) {
    await activeRepository.setBudgetAlertState(monthKey, {
      alerted80: true,
      alerted100: state.alerted100,
    });
    return {level: 80, total, limit};
  }

  return null;
}
