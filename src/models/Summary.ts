export interface CategorySummary {
  categoryId: string;
  categoryLabel: string;
  color: string;
  total: number;
  count: number;
}

export interface MonthlySummary {
  year: number;
  /** 1–12 */
  month: number;
  /** e.g. 'Mar 2025' */
  label: string;
  categories: CategorySummary[];
  total: number;
}

export interface YearlySummary {
  year: number;
  categories: CategorySummary[];
  total: number;
}
