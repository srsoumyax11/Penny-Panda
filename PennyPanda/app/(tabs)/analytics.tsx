import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text, SafeAreaView, TouchableOpacity, DimensionValue, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { expenseService, categoryService } from '@/lib/storage';
import { Expense, Category } from '@/types';
import { CATEGORIES, CURRENCIES } from '@/constants';
import { BarChart2, Calendar as CalendarIcon, Lightbulb, TrendingUp, TrendingDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import Svg, { Path, Rect, Circle, G, Text as SvgText, LinearGradient, Defs, Stop } from 'react-native-svg';

import { getCategoryIcon } from '@/utils/icons';
import { UI_COLORS } from '@/constants/theme';
import { SimpleBarChart, TimeSeriesChart } from '@/components/Charts';

type TimeRange = 'Day' | 'Week' | 'Month' | 'Year';

export default function AnalyticsScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('Month');
  const [loading, setLoading] = useState(false);

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const [expenseData, categoryData] = await Promise.all([
        expenseService.getExpenses(),
        categoryService.getAllCategories(),
      ]);
      setExpenses(expenseData);
      setCategories(categoryData);
    } catch (err) {
      console.error('Failed to load expenses', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadExpenses();
    }, [loadExpenses])
  );

  const stats = useMemo(() => {
    const now = new Date();
    const filteredExpenses: Expense[] = [];
    const prevExpenses: Expense[] = [];

    let start: Date, end: Date, prevStart: Date, prevEnd: Date;

    if (timeRange === 'Day') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      prevStart = new Date(start.getTime() - 86400000);
      prevEnd = new Date(end.getTime() - 86400000);
    } else if (timeRange === 'Week') {
      const day = now.getDay(); 
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date(start.getTime() + 6 * 86400000);
      end.setHours(23, 59, 59, 999);
      prevStart = new Date(start.getTime() - 7 * 86400000);
      prevEnd = new Date(end.getTime() - 7 * 86400000);
    } else if (timeRange === 'Month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else { // Year
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      prevStart = new Date(now.getFullYear() - 1, 0, 1);
      prevEnd = new Date(now.getFullYear() - 1, 11, 31);
    }

    expenses.forEach((e) => {
      const d = new Date(e.date);
      if (d >= start && d <= end) filteredExpenses.push(e);
      else if (d >= prevStart && d <= prevEnd) prevExpenses.push(e);
    });

    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);
    
    const categoryMap: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
    });

    const change = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : (total > 0 ? 100 : 0);

    // Time-series data grouping
    const timeData: { label: string; value: number }[] = [];
    if (timeRange === 'Day') {
      // 24 hours
      for (let h = 0; h < 24; h += 3) {
        const hourExpenses = filteredExpenses.filter(e => new Date(e.date).getHours() >= h && new Date(e.date).getHours() < h + 3);
        const val = hourExpenses.reduce((s, e) => s + e.amount, 0);
        timeData.push({ label: `${h}:00`, value: val });
      }
    } else if (timeRange === 'Week') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      days.forEach((day, idx) => {
        // Find expenses for this day of current week
        const dayExpenses = filteredExpenses.filter(e => {
           const d = new Date(e.date).getDay();
           const jsDay = idx === 6 ? 0 : idx + 1; // Map our Mon-Sun to JS 0-6
           return d === jsDay;
        });
        timeData.push({ label: day, value: dayExpenses.reduce((s, e) => s + e.amount, 0) });
      });
    } else if (timeRange === 'Month') {
      // Group by weeks
      for (let w = 1; w <= 4; w++) {
        timeData.push({ label: `W${w}`, value: 0 }); // Simplification for now
      }
      filteredExpenses.forEach(e => {
        const day = new Date(e.date).getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), 3);
        timeData[weekIdx].value += e.amount;
      });
    } else {
      // Year: Group by months
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      months.forEach((m, idx) => {
        const val = filteredExpenses.filter(e => new Date(e.date).getMonth() === idx).reduce((s, e) => s + e.amount, 0);
        timeData.push({ label: m, value: val });
      });
    }

    return { total, change, categoryMap, filteredExpenses, timeData };
  }, [expenses, timeRange]);

  const currencySymbol = CURRENCIES[0].symbol;

  const barChartData = useMemo(() => {
    return Object.entries(stats.categoryMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, value]) => {
        const cat = categories.find(c => c.id === id);
        return {
          label: cat?.name.substring(0, 3) || '?',
          value,
          color: cat?.color || UI_COLORS.primary
        };
      });
  }, [stats, categories]);

  return (
    <SafeAreaView style={styles.container}>
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
        
        {/* Time Selector */}
        <View style={styles.rangeSelector}>
          {(['Day', 'Week', 'Month', 'Year'] as TimeRange[]).map((range) => (
            <TouchableOpacity 
              key={range} 
              style={[styles.rangeBtn, timeRange === range && styles.rangeBtnActive]}
              onPress={() => setTimeRange(range)}
            >
              <Text style={[styles.rangeText, timeRange === range && styles.rangeTextActive]}>{range}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Totals */}
        <View style={styles.heroSummary}>
          <View>
            <Text style={styles.heroTitle}>Total Spending</Text>
            <Text style={styles.heroAmount}>{currencySymbol}{stats.total.toFixed(0)}</Text>
          </View>
          <View style={[styles.changeBadge, stats.change > 0 ? styles.changeBadgerDanger : styles.changeBadgeSuccess]}>
            {stats.change > 0 ? <TrendingUp size={16} color="#EF4444" /> : <TrendingDown size={16} color="#10B981" />}
            <Text style={[styles.changeText, { color: stats.change > 0 ? '#EF4444' : '#10B981' }]}>
              {Math.abs(stats.change).toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Main Spending Trend Chart */}
        <View style={styles.chartCard}>
           <Text style={styles.chartTitle}>Spending Trend</Text>
           {stats.timeData.length > 0 ? (
             <TimeSeriesChart 
               data={stats.timeData} 
               color={UI_COLORS.primary} 
               showDots={timeRange === 'Day' || timeRange === 'Week'} 
             />
           ) : (
             <View style={styles.emptyChart}>
               <Text style={styles.emptyText}>No data for trend</Text>
             </View>
           )}
        </View>

        {/* Categories Breakdown */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Top Categories</Text>
          {barChartData.length > 0 ? (
            <SimpleBarChart data={barChartData} />
          ) : (
            <View style={styles.emptyChart}>
              <Text style={styles.emptyText}>No breakdown available</Text>
            </View>
          )}
        </View>

        {/* Detailed Breakdown list */}
        <View style={[styles.breakdownSection, { paddingHorizontal: 4 }]}>
          <Text style={styles.sectionTitle}>Breakdown</Text>
          {Object.entries(stats.categoryMap).length > 0 ? Object.entries(stats.categoryMap)
            .sort(([, a], [, b]) => b - a)
            .map(([catId, amount]) => {
              const cat = categories.find(c => c.id === catId);
              const isCustom = cat && !CATEGORIES.some(c => c.id === cat.id);
              const IconComp = getCategoryIcon(cat?.name || '');
              
              return (
                <View key={catId} style={styles.breakdownRow}>
                  <View style={styles.catInfo}>
                    <View style={[styles.catIcon, { backgroundColor: (cat?.color || UI_COLORS.primary) + '15' }]}>
                      {isCustom ? (
                        <Text style={{ fontSize: 16 }}>{cat.icon}</Text>
                      ) : (
                        <IconComp color={cat?.color || UI_COLORS.primary} size={18} />
                      )}
                    </View>
                    <Text style={styles.catNameText}>{cat?.name || 'Other'}</Text>
                  </View>
                  <Text style={styles.catAmountText}>{currencySymbol}{amount.toFixed(0)}</Text>
                </View>
              );
            }) : (
              <Text style={styles.emptyText}>Nothing here yet.</Text>
            )}
        </View>

        {/* Insights */}
        <View style={styles.insightBox}>
          <View style={styles.insightHeader}>
             <Lightbulb size={20} color={UI_COLORS.primary} />
             <Text style={styles.insightHeaderTitle}>Smart insight</Text>
          </View>
          <Text style={styles.insightContent}>
             {stats.total > 1000 ? "Caution: High spending detected. Review your breakdown to find optimization points." : 
              stats.total > 0 ? "Great job! Your profile shows healthy spending patterns for this period." :
              "Start tracking to unlock advanced financial insights."}
          </Text>
        </View>

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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 20 : 50,
    paddingBottom: 12,
    backgroundColor: UI_COLORS.background,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: UI_COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: UI_COLORS.textMain,
  },
  calendarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#F7FAFC',
    borderRadius: 25,
    padding: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 22,
  },
  rangeBtnActive: {
    backgroundColor: UI_COLORS.primary,
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#718096',
  },
  rangeTextActive: {
    color: '#FFF',
  },
  heroSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  heroTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#718096',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '900',
    color: UI_COLORS.textMain,
    letterSpacing: -0.5,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  changeBadgeSuccess: {
    backgroundColor: '#DEF7EC',
  },
  changeBadgerDanger: {
    backgroundColor: '#FDE8E8',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 3,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginBottom: 12,
  },
  breakdownSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: UI_COLORS.textMain,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  catInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: UI_COLORS.textMain,
  },
  catAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  insightBox: {
    backgroundColor: UI_COLORS.primaryLight,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: UI_COLORS.primary,
    marginLeft: 8,
  },
  insightContent: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4A5568',
    fontWeight: '600',
  },
  emptyChart: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#A0AEC0',
    fontWeight: '600',
  }
});


