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
    scheme: 'phonepe://pay',
  },
  {
    id: 'paytm',
    label: 'Paytm',
    scheme: 'paytmmp://upi/pay',
  },
  {
    id: 'bhim',
    label: 'BHIM',
    scheme: 'bhim://upi',
  },
];
