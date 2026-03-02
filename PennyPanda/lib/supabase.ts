import { createClient } from '@supabase/supabase-js';
import { Expense, Budget, UserSettings } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const expenseService = {
  async getExpenses(filters?: {
    category?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<Expense[]> {
    let query = supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.startDate) {
      query = query.gte('date', filters.startDate.toISOString());
    }

    if (filters?.endDate) {
      query = query.lte('date', filters.endDate.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async addExpense(expense: Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('expenses')
      .insert([{ ...expense, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw error;
  },
};

export const budgetService = {
  async getBudgets(): Promise<Budget[]> {
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .order('category');

    if (error) throw error;
    return data || [];
  },

  async addBudget(budget: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Budget> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('budgets')
      .insert([{ ...budget, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateBudget(id: string, updates: Partial<Budget>): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteBudget(id: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },

  async getBudgetStatus(category: string, month: Date): Promise<{ spent: number; limit: number }> {
    const budget = await supabase
      .from('budgets')
      .select('monthly_limit')
      .eq('category', category)
      .single();

    const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const expenses = await supabase
      .from('expenses')
      .select('amount')
      .eq('category', category)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString());

    const spent = (expenses.data || []).reduce((sum, exp) => sum + exp.amount, 0);
    const limit = budget.data?.monthly_limit || 0;

    return { spent, limit };
  },
};

export const settingsService = {
  async getSettings(): Promise<UserSettings> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return {
        user_id: user.id,
        default_currency: 'USD',
        budget_alert_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    if (error) throw error;
    return data;
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ ...settings, user_id: user.id })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
