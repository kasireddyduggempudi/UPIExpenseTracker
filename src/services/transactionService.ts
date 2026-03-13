import {
  CategorySpend,
  getAllTransactions,
  getCategorySpend,
  getMonthlySpend,
  initDatabase,
  insertTransaction,
} from '../database/sqlite';
import {Transaction, TransactionStatus} from '../models/Transaction';

export interface CreateTransactionInput {
  amount: number;
  category: string;
  upiId: string;
  status: TransactionStatus;
  txnId?: string;
}

export interface DashboardStats {
  monthlySpend: number;
  weeklySpend: number;
  categorySpend: CategorySpend[];
}

const isSuccessTransaction = (transaction: Transaction): boolean =>
  transaction.status === 'SUCCESS';

export const initializeTransactionStore = async (): Promise<void> => {
  await initDatabase();
};

export const createTransaction = async (
  input: CreateTransactionInput,
): Promise<Transaction> => {
  const transaction: Transaction = {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    amount: input.amount,
    category: input.category,
    upiId: input.upiId,
    date: new Date().toISOString(),
    status: input.status,
    txnId: input.txnId,
  };

  await insertTransaction(transaction);
  return transaction;
};

export const listTransactions = async (): Promise<Transaction[]> => {
  const rows = await getAllTransactions();
  return rows;
};

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const [monthlySpend, categorySpend, allTransactions] = await Promise.all([
    getMonthlySpend(),
    getCategorySpend(),
    getAllTransactions(),
  ]);

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const weeklySpend = allTransactions
    .filter(transaction => {
      const transactionTime = new Date(transaction.date).getTime();
      return (
        transactionTime >= sevenDaysAgo &&
        transactionTime <= now &&
        isSuccessTransaction(transaction)
      );
    })
    .reduce((acc, transaction) => acc + transaction.amount, 0);

  const safeCategorySpend = categorySpend.map(item => ({
    category: item.category,
    total: Number.isNaN(item.total) ? 0 : item.total,
  }));

  return {
    monthlySpend,
    weeklySpend,
    categorySpend: safeCategorySpend,
  };
};
