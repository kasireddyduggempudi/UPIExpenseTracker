export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  {id: 'food', label: 'Food & Dining', icon: '🍽️', color: '#FF6B6B'},
  {id: 'groceries', label: 'Groceries', icon: '🛒', color: '#2ECC71'},
  {id: 'clothing', label: 'Clothes', icon: '👕', color: '#9B59B6'},
  {id: 'transport', label: 'Transport', icon: '🚗', color: '#4ECDC4'},
  {id: 'shopping', label: 'Shopping', icon: '🛍️', color: '#45B7D1'},
  {id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#6C5CE7'},
  {id: 'health', label: 'Health', icon: '💊', color: '#E17055'},
  {id: 'personal-care', label: 'Personal Care', icon: '🧴', color: '#FF8DA1'},
  {id: 'utilities', label: 'Utilities', icon: '💡', color: '#F0A500'},
  {
    id: 'mobile-internet',
    label: 'Mobile & Internet',
    icon: '📶',
    color: '#16A085',
  },
  {id: 'rent', label: 'Rent', icon: '🏠', color: '#0984E3'},
  {id: 'insurance', label: 'Insurance', icon: '🛡️', color: '#34495E'},
  {id: 'emi-loan', label: 'EMI / Loan', icon: '💳', color: '#8E44AD'},
  {id: 'education', label: 'Education', icon: '📚', color: '#00B894'},
  {id: 'travel', label: 'Travel', icon: '✈️', color: '#FDCB6E'},
  {id: 'subscriptions', label: 'Subscriptions', icon: '📺', color: '#5D6D7E'},
  {id: 'gifts', label: 'Gifts', icon: '🎁', color: '#E84393'},
  {id: 'pets', label: 'Pets', icon: '🐾', color: '#D35400'},
  {id: 'other', label: 'Other', icon: '📦', color: '#95A5A6'},
];

/** O(1) lookup by category id */
export const CATEGORY_MAP: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map(c => [c.id, c]),
);

export const OTHER_CATEGORY_ID = 'other';
