export type TransactionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'PENDING'
  | 'SUBMITTED'
  | 'UNKNOWN';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  upiId: string;
  date: string;
  status: TransactionStatus;
  txnId?: string;
}
