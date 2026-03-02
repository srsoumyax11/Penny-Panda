import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, SafeAreaView, ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { expenseService } from '@/lib/supabase';
import { Expense } from '@/types';
import { Card } from '@/components/Card';
import { SummaryCard } from '@/components/SummaryCard';
import { CATEGORIES, CURRENCIES } from '@/constants';

export default function AnalyticsScreen() {
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

  const calculateStats = () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyExpenses = expenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= thisMonth && expenseDate <= nextMonth;
    });

    const categoryTotals: Record<string, number> = {};
    monthlyExpenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const totalMonthly = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAll = expenses.reduce((sum, e) => sum + e.amount, 0);
    const averageExpense = monthlyExpenses.length > 0 ? totalMonthly / monthlyExpenses.length : 0;

    return { categoryTotals, totalMonthly, totalAll, averageExpense, monthlyExpenses };
  };

  const { categoryTotals, totalMonthly, totalAll, averageExpense } = calculateStats();
  const currency = expenses.length > 0 ? expenses[0].currency : 'USD';
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: ((amount / totalMonthly) * 100).toFixed(1),
    }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.summaryContainer}>
          <SummaryCard
            label="This Month"
            amount={totalMonthly.toFixed(2)}
            currency={currencySymbol}
          />
          <SummaryCard
            label="Total"
            amount={totalAll.toFixed(2)}
            currency={currencySymbol}
          />
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Average Expense</Text>
            <Text style={styles.statValue}>
              {currencySymbol} {averageExpense.toFixed(2)}
            </Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statLabel}>Transactions</Text>
            <Text style={styles.statValue}>{expenses.length}</Text>
          </Card>
        </View>

        {sortedCategories.length > 0 ? (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Spending by Category</Text>
            {sortedCategories.map((item) => {
              const categoryInfo = CATEGORIES.find((c) => c.id === item.category);
              return (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryIcon}>{categoryInfo?.icon || '📌'}</Text>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName}>{categoryInfo?.name || 'Other'}</Text>
                      <View style={styles.percentageBar}>
                        <View
                          style={[
                            styles.percentageFill,
                            { width: `${Math.min(parseFloat(item.percentage), 100)}%` as any },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                  <View style={styles.categoryAmount}>
                    <Text style={styles.amount}>
                      {currencySymbol} {item.amount.toFixed(2)}
                    </Text>
                    <Text style={styles.percentage}>{item.percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Card style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No spending data for this month</Text>
          </Card>
        )}
      </ScrollView>

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
    flex: 1,
  },
  contentInner: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  categoryItem: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 6,
  },
  percentageBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  percentageFill: {
    height: '100%',
    backgroundColor: '#000000',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  percentage: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
    marginBottom: 24,
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
