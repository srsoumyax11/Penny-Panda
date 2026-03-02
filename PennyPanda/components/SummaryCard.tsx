import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';

import { UI_COLORS } from '@/constants/theme';

interface DashboardSummaryProps {
  todayAmount: string;
  monthAmount: string;
  currency: string;
}

export function SummaryCard({ todayAmount, monthAmount, currency }: DashboardSummaryProps) {
  // Mock percentage calc. Ideally comes from a Budget Service
  const mockBudget = 2000;
  const numMonth = parseFloat(monthAmount.replace(',', '')) || 0;
  const percentUsed = Math.min((numMonth / mockBudget) * 100, 100).toFixed(0);

  return (
    <View style={styles.card}>
      <View style={styles.section}>
        <Text style={styles.label}>TODAY'S SPENDING</Text>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{currency}{todayAmount}</Text>
          <Text style={styles.trend}>↓ 12%</Text>
        </View>
      </View>
      <View style={{ height: 24 }} />
      <View style={styles.section}>
        <Text style={styles.label}>THIS MONTH'S SPENDING</Text>
        <Text style={styles.amountMonth}>{currency}{monthAmount}</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${percentUsed}%` as DimensionValue }]} />
        </View>
        <Text style={styles.progressText}>{percentUsed}% of your monthly budget used</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: UI_COLORS.card,
    borderRadius: 24,
    padding: 24,
    marginVertical: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  section: {
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: UI_COLORS.textSecondary,
    marginBottom: 6,
    letterSpacing: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  amount: {
    fontSize: 28,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  amountMonth: {
    fontSize: 24,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginBottom: 16,
  },
  trend: {
    fontSize: 12,
    fontWeight: '600',
    color: UI_COLORS.success,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: UI_COLORS.primaryLight,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: UI_COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 10,
    color: UI_COLORS.textSecondary,
  }
});
