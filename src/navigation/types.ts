import {Transaction} from '../models/Transaction';

export type RootStackParamList = {
  Dashboard: undefined;
  History: undefined;
  AddExpense:
    | {
        expense?: Transaction;
      }
    | undefined;
  MonthDetail: {
    year: number;
    month: number;
    /** e.g. 'Mar 2025' */
    label: string;
  };
};
