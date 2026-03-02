export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: string;
  description: string | null;
  date: string;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  currency: string;
  created_at: string;
  updated_at: string;
};

export type UserSettings = {
  user_id: string;
  default_currency: string;
  budget_alert_enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type ExpenseFilters = {
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
};
