export const CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍔', color: '#FFA500' },
  { id: 'transport', name: 'Transport', icon: '🚗', color: '#2196F3' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#9C27B0' },
  { id: 'utilities', name: 'Utilities', icon: '💡', color: '#FF9800' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#E91E63' },
  { id: 'health', name: 'Health & Fitness', icon: '💪', color: '#4CAF50' },
  { id: 'education', name: 'Education', icon: '📚', color: '#2196F3' },
  { id: 'other', name: 'Other', icon: '📌', color: '#757575' },
];

export const PAYMENT_METHODS = [
  { id: 'cash', name: 'Cash', icon: '💵' },
  { id: 'upi', name: 'UPI', icon: '📱' },
  { id: 'card', name: 'Card', icon: '💳' },
  { id: 'bank', name: 'Bank', icon: '🏦' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
];

// Base USD rates for conversion logic
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.5,
  INR: 82.9,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.88,
  CNY: 7.19,
  SEK: 10.35,
};

export const DEFAULT_CURRENCY = 'INR';
export const DEFAULT_BUDGET_LIMIT = 5000; // Increased default for INR
export const BUDGET_ALERT_PERCENTAGE = 80;
