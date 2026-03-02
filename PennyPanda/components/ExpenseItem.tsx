import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '@/types';
import { CATEGORIES, CURRENCIES } from '@/constants';
import { Trash2 } from 'lucide-react-native';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const category = CATEGORIES.find((c) => c.id === expense.category);
  const currency = CURRENCIES.find((c) => c.code === expense.currency);
  const date = new Date(expense.date);
  const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => onEdit(expense)} style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{category?.icon || '📌'}</Text>
          <View style={styles.info}>
            <Text style={styles.category}>{category?.name || 'Other'}</Text>
            <Text style={styles.description}>{expense.description || 'No description'}</Text>
          </View>
          <Text style={styles.amount}>
            {currency?.symbol || '$'} {expense.amount.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.date}>{formattedDate}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.deleteButton}>
        <Trash2 size={18} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  description: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  date: {
    fontSize: 12,
    color: '#999999',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
