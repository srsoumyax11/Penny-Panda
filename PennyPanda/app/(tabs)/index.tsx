import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { expenseService } from '@/lib/storage';
import { Expense } from '@/types';
import { ExpenseItem } from '@/components/ExpenseItem';
import { SummaryCard } from '@/components/SummaryCard';
import { Card } from '@/components/Card';
import { CURRENCIES } from '@/constants';
import { Bell } from 'lucide-react-native';

import { UI_COLORS } from '@/constants/theme';

import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
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
      <View style={styles.header}>
        <View style={styles.headerProfile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>🐼</Text>
          </View>
          <View>
            <Text style={styles.greeting}>PennyPanda</Text>
            <Text style={styles.subGreeting}>Welcome back, {session?.name || 'Friend'}!</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Bell color="#4A5568" size={20} />
        </TouchableOpacity>
      </View>

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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <SummaryCard 
              todayAmount={todayTotal.toFixed(2)}
              monthAmount={monthlyTotal.toFixed(2)}
              currency={currencySymbol}
            />

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Expenses</Text>
              <TouchableOpacity>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            {expenses.length === 0 && (
              <Card style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No expenses yet</Text>
                <Text style={styles.emptyStateText}>
                  Start tracking your spending by adding your first expense.
                </Text>
              </Card>
            )}
          </>
        }
        contentContainerStyle={styles.scrollContent}
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
    backgroundColor: UI_COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: UI_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9', // subtle gray for bell button
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  subGreeting: {
    fontSize: 12,
    color: '#718096',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_COLORS.primary,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: UI_COLORS.textMain,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: UI_COLORS.textSecondary,
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
