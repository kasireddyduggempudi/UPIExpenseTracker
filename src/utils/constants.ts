export const CATEGORIES = [
  'Food',
  'Travel',
  'Bills',
  'Shopping',
  'Health',
  'Others',
];

export interface UpiAppOption {
  id: string;
  label: string;
  scheme: string;
}

export const UPI_APPS: UpiAppOption[] = [
  {
    id: 'gpay',
    label: 'Google Pay',
    scheme: 'tez://upi/',
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    scheme: 'phonepe://',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    scheme: 'paytmmp://',
  },
  {
    id: 'bhim',
    label: 'BHIM',
    scheme: 'bhim://upi',
  },
];
