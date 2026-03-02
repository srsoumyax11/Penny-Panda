import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, SafeAreaView, TouchableOpacity, DimensionValue } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { expenseService } from '@/lib/storage';
import { Expense } from '@/types';
import { CATEGORIES, CURRENCIES } from '@/constants';
import { BarChart2, Calendar as CalendarIcon, Lightbulb, TrendingUp, Zap, Utensils, ShoppingBag, Car, Film, Home as HomeIcon, DollarSign } from 'lucide-react-native';

const UI_COLORS = {
  background: '#FAFAFD',
  surface: '#FFFFFF',
  textMain: '#1A1A1A',
  textSecondary: '#A0AEC0',
  primary: '#8B5CF6',
  primaryLight: '#EDE9FE',
  border: '#F1F5F9',
};

const getCategoryIcon = (categoryName: string) => {
  switch(categoryName.toLowerCase()) {
    case 'food':
    case 'food & dining': return Utensils;
    case 'transport': return Car;
    case 'shopping': return ShoppingBag;
    case 'utilities': return Zap;
    case 'home': return HomeIcon;
    case 'entertainment': return Film;
    default: return DollarSign;
  }
}

// Helper to format months
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function AnalyticsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For the month selector, let's keep track of an offset from current month
  // 0 = current month, -1 = last month, -2 = two months ago
  const [monthOffset, setMonthOffset] = useState(0);

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

  const calculateStats = (offset: number) => {
    const now = new Date();
    // Target month
    const targetRef = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const startOfMonth = new Date(targetRef.getFullYear(), targetRef.getMonth(), 1);
    const endOfMonth = new Date(targetRef.getFullYear(), targetRef.getMonth() + 1, 0);

    // Prev month for comparison
    const prevStart = new Date(targetRef.getFullYear(), targetRef.getMonth() - 1, 1);
    const prevEnd = new Date(targetRef.getFullYear(), targetRef.getMonth(), 0);

    let currentMonthTotal = 0;
    let prevMonthTotal = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((e) => {
      const expenseDate = new Date(e.date);
      if (expenseDate >= startOfMonth && expenseDate <= endOfMonth) {
        currentMonthTotal += e.amount;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
      } else if (expenseDate >= prevStart && expenseDate <= prevEnd) {
        prevMonthTotal += e.amount;
      }
    });

    // Calculate percentage change
    let percentageChange = 0;
    if (prevMonthTotal > 0) {
      percentageChange = ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
    } else if (currentMonthTotal > 0) {
      percentageChange = 100;
    }

    return { categoryTotals, currentMonthTotal, percentageChange, targetRef };
  };

  const { categoryTotals, currentMonthTotal, percentageChange, targetRef } = calculateStats(monthOffset);
  const currency = expenses.length > 0 ? expenses[0].currency : 'USD';
  const currencySymbol = CURRENCIES.find((c) => c.code === currency)?.symbol || '$';

  const sortedCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: currentMonthTotal > 0 ? ((amount / currentMonthTotal) * 100).toFixed(0) : '0',
    }));

  const getMonthLabel = (offset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + offset);
    return monthNames[d.getMonth()];
  };

  // Top spender category for insight
  const topCategoryStr = sortedCategories.length > 0 ? CATEGORIES.find(c => c.id === sortedCategories[0].category)?.name || "Expenses" : "Expenses";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.iconContainer}>
             <BarChart2 color={UI_COLORS.primary} size={24} />
          </View>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>
        <TouchableOpacity style={styles.calendarBtn}>
          <CalendarIcon color="#64748B" size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        
        {/* Month Tabs */}
        <View style={styles.monthTabs}>
          {[-2, -1, 0].map((offset) => {
            const isActive = monthOffset === offset;
            return (
              <TouchableOpacity
                key={offset}
                style={[styles.monthTab, isActive && styles.monthTabActive]}
                onPress={() => setMonthOffset(offset)}
              >
                <Text style={[styles.monthTabText, isActive && styles.monthTabTextActive]}>
                  {getMonthLabel(offset)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
           <Text style={styles.heroLabel}>Total Spending</Text>
           <View style={styles.heroRow}>
              <Text style={styles.heroAmount}>{currencySymbol}{currentMonthTotal.toFixed(2)}</Text>
              {percentageChange !== 0 && (
                <View style={styles.heroBadge}>
                   <TrendingUp color="#FFFFFF" size={14} style={{ marginRight: 4 }} />
                   <Text style={styles.heroBadgeText}>
                     {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(0)}% from last month
                   </Text>
                </View>
              )}
           </View>
        </View>

        {/* Category Breakdown */}
        {sortedCategories.length > 0 ? (
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Category Breakdown</Text>
              <Text style={styles.sectionSubtitle}>TOP CATEGORIES</Text>
            </View>

            {sortedCategories.map((item) => {
              const categoryInfo = CATEGORIES.find((c) => c.id === item.category);
              const IconComp = getCategoryIcon(categoryInfo?.name || '');
              const catColor = categoryInfo?.color || UI_COLORS.primary;

              return (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.catRowTop}>
                    <View style={styles.catIdent}>
                       <IconComp color={catColor} size={20} />
                       <Text style={styles.catName}>{categoryInfo?.name || 'Other'}</Text>
                    </View>
                    <View style={styles.catValues}>
                       <Text style={styles.catAmount}>{currencySymbol}{item.amount.toFixed(2)}</Text>
                       <Text style={styles.catPercent}>{item.percentage}%</Text>
                    </View>
                  </View>
                  <View style={styles.progressTrack}>
                     <View 
                        style={[
                          styles.progressFill, 
                          { 
                            width: `${Math.min(parseInt(item.percentage), 100)}%` as DimensionValue,
                            backgroundColor: catColor
                          }
                        ]} 
                     />
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No spending data for this month.</Text>
          </View>
        )}

        {/* Panda Insight */}
        {sortedCategories.length > 0 && (
          <View style={styles.insightCard}>
            <View style={styles.insightHeader}>
              <Lightbulb color={UI_COLORS.primary} size={20} fill={UI_COLORS.primary} />
              <Text style={styles.insightTitle}>Panda Insight</Text>
            </View>
            <Text style={styles.insightText}>
              A large portion of your budget went heavily into <Text style={{ color: UI_COLORS.primary, fontWeight: '700'}}>{topCategoryStr}</Text> this month. Consider reviewing those expenses for next time!
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 60, // Accommodate notch without native header
    paddingBottom: 20,
    backgroundColor: UI_COLORS.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: UI_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_COLORS.surface,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
  },
  monthTabs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 30,
    padding: 4,
    marginBottom: 24,
  },
  monthTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 24,
  },
  monthTabActive: {
    backgroundColor: UI_COLORS.primary,
  },
  monthTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  monthTabTextActive: {
    color: '#FFFFFF',
  },
  heroCard: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroAmount: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
  },
  categoryItem: {
    marginBottom: 24,
  },
  catRowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catIdent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catName: {
    fontSize: 16,
    fontWeight: '700',
    color: UI_COLORS.textMain,
    marginLeft: 12,
  },
  catValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: UI_COLORS.textMain,
  },
  catPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    marginLeft: 8,
    width: 36,
    textAlign: 'right',
  },
  progressTrack: {
    height: 12,
    backgroundColor: '#F1F5F9', // Light slate
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  insightCard: {
    backgroundColor: UI_COLORS.surface,
    borderRadius: 24,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: UI_COLORS.border,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
    fontWeight: '500',
  }
});
