export type RootStackParamList = {
  Dashboard: undefined;
  AddExpense: undefined;
  MonthDetail: {
    year: number;
    month: number;
    /** e.g. 'Mar 2025' */
    label: string;
  };
};
