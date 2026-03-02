import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types';
import { ExpenseItem } from '@/components/ExpenseItem';
import { SummaryCard } from '@/components/SummaryCard';
import { Card } from '@/components/Card';
import { CURRENCIES } from '@/constants';

export default function HomeScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await expenseService.getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const handleDelete = async (id: string) => {
    try {
      await expenseService.deleteExpense(id);
      setExpenses(expenses.filter((e) => e.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    router.push({
      pathname: '/edit-expense',
      params: { id: expense.id },
    });
  };

  const calculateTotals = () => {
    const thisMonth = new Date();
    const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
    const endOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 0);

    const monthlyExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= startOfMonth && expenseDate <= endOfMonth;
    });

    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayExpenses = expenses.filter(
      (e) => new Date(e.date).toDateString() === new Date().toDateString()
    );
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

    return { monthlyTotal, todayTotal };
  };

  const { monthlyTotal, todayTotal } = calculateTotals();
  const currency = expenses.length > 0 ? expenses[0].currency : 'USD';
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={expenses}
        renderItem={({ item }) => (
          <ExpenseItem
            expense={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View style={styles.summaryContainer}>
              <SummaryCard
                label="Today"
                amount={todayTotal.toFixed(2)}
                currency={currencySymbol}
              />
              <SummaryCard
                label="This Month"
                amount={monthlyTotal.toFixed(2)}
                currency={currencySymbol}
              />
            </View>

            {expenses.length === 0 ? (
              <Card style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No expenses yet</Text>
                <Text style={styles.emptyStateText}>
                  Start tracking your spending by adding your first expense.
                </Text>
              </Card>
            ) : (
              <Text style={styles.recentExpenses}>Recent Expenses</Text>
            )}
          </>
        }
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadExpenses} />
        }
        scrollEnabled={true}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  recentExpenses: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#FFF5F5',
    borderTopWidth: 1,
    borderTopColor: '#FF0000',
    padding: 12,
    alignItems: 'center',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
  },
});
