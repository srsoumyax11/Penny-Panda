import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { Expense, Budget, UserSettings, Category } from '@/types';

const EXPENSES_KEY = '@expenses';
const BUDGETS_KEY = '@budgets';
const SETTINGS_KEY = '@user_settings';
const CUSTOM_CATEGORIES_KEY = '@custom_categories';

// Helper to get matching records
const filterRecords = <T extends any>(records: T[], filters: any) => {
  return records.filter((rec) => {
    let match = true;
    for (const key in filters) {
      if (typeof filters[key] === 'function') {
         match = match && filters[key](rec);
      } else {
         match = match && rec[key as keyof T] === filters[key];
      }
    }
    return match;
  });
};

export const expenseService = {
  async getExpenses(filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    let records: Expense[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    // Sort logic (descending by date)
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (filters) {
      records = records.filter((exp) => {
        let match = true;
        if (filters.category && exp.category !== filters.category) match = false;
        if (filters.startDate && new Date(exp.date) < filters.startDate) match = false;
        if (filters.endDate && new Date(exp.date) > filters.endDate) match = false;
        return match;
      });
    }
    return records;
  },

  async addExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) throw new Error('Not authenticated');
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    const records: Expense[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newRecord: Expense = {
      ...expense,
      id: uuid.v4().toString(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    records.push(newRecord);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(records));
    return newRecord;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    const records: Expense[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const index = records.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Expense not found');
    
    records[index] = { ...records[index], ...updates, updated_at: new Date().toISOString() };
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(records));
    
    return records[index];
  },

  async deleteExpense(id: string): Promise<void> {
    const jsonValue = await AsyncStorage.getItem(EXPENSES_KEY);
    const records: Expense[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newRecords = records.filter(r => r.id !== id);
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(newRecords));
  },
};

export const budgetService = {
  async getBudgets(): Promise<Budget[]> {
    const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
    const records: Budget[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    records.sort((a, b) => a.category.localeCompare(b.category));
    return records;
  },

  async addBudget(budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) throw new Error('Not authenticated');
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
    const records: Budget[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newRecord: Budget = {
      ...budget,
      id: uuid.v4().toString(),
      user_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    records.push(newRecord);
    await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(records));
    return newRecord;
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
    const records: Budget[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const index = records.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Budget not found');
    
    records[index] = { ...records[index], ...updates, updated_at: new Date().toISOString() };
    await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(records));
    
    return records[index];
  },

  async deleteBudget(id: string): Promise<void> {
    const jsonValue = await AsyncStorage.getItem(BUDGETS_KEY);
    const records: Budget[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newRecords = records.filter(r => r.id !== id);
    await AsyncStorage.setItem(BUDGETS_KEY, JSON.stringify(newRecords));
  },

  async getBudgetStatus(category: string, month: Date): Promise<{ spent: number; limit: number }> {
    const budgets = await this.getBudgets();
    const budgetMatch = budgets.find(b => b.category === category);
    const limit = budgetMatch ? budgetMatch.monthly_limit : 0;

    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const expensesJson = await AsyncStorage.getItem(EXPENSES_KEY);
    const expenses: Expense[] = expensesJson != null ? JSON.parse(expensesJson) : [];

    const spent = expenses
      .filter(exp => exp.category === category && new Date(exp.date) >= startDate && new Date(exp.date) <= endDate)
      .reduce((sum, exp) => sum + exp.amount, 0);

    return { spent, limit };
  },
};

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) throw new Error('Not authenticated');
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    const records: UserSettings[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const userSettings = records.find(r => r.user_id === user.id);

    if (!userSettings) {
      const defaultSettings: UserSettings = {
        id: uuid.v4().toString(),
        user_id: user.id,
        default_currency: 'USD',
        budget_alert_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      records.push(defaultSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(records));
      return defaultSettings;
    }
    return userSettings;
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) throw new Error('Not authenticated');
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
    const records: UserSettings[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const index = records.findIndex(r => r.user_id === user.id);

    if (index > -1) {
      records[index] = { ...records[index], ...settings, updated_at: new Date().toISOString() };
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(records));
      return records[index];
    } else {
      const newSettings: UserSettings = {
        id: uuid.v4().toString(),
        user_id: user.id,
        default_currency: 'USD',
        budget_alert_enabled: true,
        ...settings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      records.push(newSettings);
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(records));
      return newSettings;
    }
  },
};

export const categoryService = {
  async getCustomCategories(): Promise<Category[]> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) return [];
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const records: (Category & { user_id: string })[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    return records
      .filter(r => r.user_id === user.id)
      .map(({ user_id, ...cat }) => cat);
  },

  async addCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const sessionStr = await AsyncStorage.getItem('@session');
    if (!sessionStr) throw new Error('Not authenticated');
    const user = JSON.parse(sessionStr);

    const jsonValue = await AsyncStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const records: (Category & { user_id: string })[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    
    const newCategory = {
      ...category,
      id: uuid.v4().toString(),
      user_id: user.id,
    };

    records.push(newCategory);
    await AsyncStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(records));
    
    const { user_id, ...cat } = newCategory;
    return cat;
  },

  async getAllCategories(): Promise<Category[]> {
    const { CATEGORIES } = require('@/constants');
    const custom = await this.getCustomCategories();
    return [...CATEGORIES, ...custom];
  },
};
