import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '@/types';
import { CATEGORIES, CURRENCIES, PAYMENT_METHODS } from '@/constants';
import { Trash2, ShoppingBag, Utensils, Zap, Car, Home as HomeIcon, Film, DollarSign, Wallet } from 'lucide-react-native';

import { getCategoryIcon } from '@/utils/icons';
import { UI_COLORS, CATEGORY_COLORS } from '@/constants/theme';

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}


export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const category = CATEGORIES.find((c) => c.id === expense.category);
  const currency = CURRENCIES.find((c) => c.code === expense.currency);
  const paymentMethod = PAYMENT_METHODS.find((p) => p.id === expense.payment_method);
  const date = new Date(expense.date);
  
  const isToday = new Date().toDateString() === date.toDateString();
  const formattedDate = isToday 
    ? `Today ${date.toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit'})}` 
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute:'2-digit' });

  const IconComponent = getCategoryIcon(category?.name || '');
  const catTheme = CATEGORY_COLORS[category?.name?.toLowerCase() || ''] || { bg: '#F3F4F6', icon: '#6B7280' };

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => onEdit(expense)} style={styles.expenseCard}>
        <View style={styles.expenseLeft}>
          <View style={[styles.iconContainer, { backgroundColor: catTheme.bg }]}>
            <IconComponent size={20} color={catTheme.icon} strokeWidth={2.5}/>
          </View>
          <View>
            {expense.description ? (
               <Text style={styles.descriptionText}>{expense.description}</Text>
            ) : (
               <Text style={styles.descriptionText}>{category?.name || 'Other'}</Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
               <Text style={styles.categoryText}>{category?.name || 'Other'} • {formattedDate}</Text>
               {paymentMethod && (
                 <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>{paymentMethod.icon} {paymentMethod.name}</Text>
                 </View>
               )}
            </View>
          </View>
        </View>
        <View style={styles.expenseRight}>
          <Text style={styles.amountText}>
             -{currency?.symbol || '$'}{expense.amount.toFixed(2)}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => onDelete(expense.id)} style={styles.deleteButton}>
        <Trash2 size={20} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  expenseCard: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    backgroundColor: UI_COLORS.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  descriptionText: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_COLORS.textMain,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 10,
    color: UI_COLORS.textSecondary,
    fontWeight: '500',
  },
  expenseRight: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  deleteButton: {
    paddingLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  paymentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
});
