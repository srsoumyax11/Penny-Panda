import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Expense } from '@/types';
import { CATEGORIES, CURRENCIES } from '@/constants';
import { Trash2, ShoppingBag, Utensils, Zap, Car, Home as HomeIcon, Film, DollarSign } from 'lucide-react-native';

const UI_COLORS = {
  background: '#F8F9FA',
  card: '#FFFFFF',
  textMain: '#1A1A1A',
  textSecondary: '#A0AEC0',
  primary: '#8B5CF6',
};

const CATEGORY_COLORS: Record<string, { bg: string, icon: string }> = {
  'food': { bg: '#FFEDD5', icon: '#F97316' },            // Orange
  'food & dining': { bg: '#FFEDD5', icon: '#F97316' }, // Orange
  'transport': { bg: '#E0F2FE', icon: '#0EA5E9' },       // Blue
  'shopping': { bg: '#DCFCE7', icon: '#22C55E' },        // Green
  'utilities': { bg: '#FEF08A', icon: '#EAB308' },       // Yellow
  'home': { bg: '#F3E8FF', icon: '#A855F7' },            // Purple
  'entertainment': { bg: '#FCE7F3', icon: '#EC4899' },   // Pink
};

interface ExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

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

export function ExpenseItem({ expense, onEdit, onDelete }: ExpenseItemProps) {
  const category = CATEGORIES.find((c) => c.id === expense.category);
  const currency = CURRENCIES.find((c) => c.code === expense.currency);
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
            <Text style={styles.categoryText}>{category?.name || 'Other'} • {formattedDate}</Text>
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
});
