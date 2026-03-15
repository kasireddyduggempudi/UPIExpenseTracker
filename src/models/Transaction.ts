export interface Transaction {
  id: string;
  amount: number;
  /** Category id e.g. 'food', 'transport', 'other' */
  category: string;
  /** Filled when category === 'other' */
  customCategory?: string;
  /** Optional freeform note */
  note?: string;
  /** Date in YYYY-MM-DD format */
  date: string;
  /** ISO timestamp of when the record was created */
  createdAt: string;
}
