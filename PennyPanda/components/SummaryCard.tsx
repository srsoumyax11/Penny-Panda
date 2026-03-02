import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SummaryCardProps {
  label: string;
  amount: string;
  currency: string;
  variant?: 'default' | 'alert';
}

export function SummaryCard({ label, amount, currency, variant = 'default' }: SummaryCardProps) {
  return (
    <View style={[styles.card, variant === 'alert' && styles.alertCard]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.amountContainer}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.amount}>{amount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF0000',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginRight: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
});
