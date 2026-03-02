import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Text, SafeAreaView, TouchableOpacity, DimensionValue, Platform, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronLeft, Plus, Wallet, Trash2, Edit3, X } from 'lucide-react-native';
import { budgetService, expenseService, settingsService, categoryService } from '@/lib/storage';
import { Budget, Expense, UserSettings, Category } from '@/types';
import { CATEGORIES, CURRENCIES } from '@/constants';
import { UI_COLORS } from '@/constants/theme';
import { getCategoryIcon } from '@/utils/icons';
import { Input } from '@/components/Input';

export default function BudgetScreen() {
  const router = useRouter();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newBudgetCategory, setNewBudgetCategory] = useState<string | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [fetchedBudgets, fetchedExpenses, fetchedSettings, fetchedCategories] = await Promise.all([
        budgetService.getBudgets(),
        expenseService.getExpenses(),
        settingsService.getSettings(),
        categoryService.getAllCategories(),
      ]);

      setBudgets(fetchedBudgets);
      setExpenses(fetchedExpenses);
      setSettings(fetchedSettings);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const currencySymbol = CURRENCIES.find(c => c.code === settings?.default_currency)?.symbol || '$';

  // Calculate totals
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  
  // Get expenses for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  const currentMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= startOfMonth && d <= endOfMonth;
  });

  const totalSpent = currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) : 0;

  const getStatusInfo = (spent: number, limit: number) => {
    const ratio = spent / limit;
    if (ratio >= 1) return { label: 'Over Budget', color: '#ef4444', bgColor: '#fee2e2' };
    if (ratio >= 0.8) return { label: 'Near Limit', color: '#f97316', bgColor: '#ffedd5' };
    if (ratio < 0.5) return { label: 'Healthy', color: '#10b981', bgColor: '#dcfce7' };
    return { label: 'On Track', color: '#6366f1', bgColor: '#e0e7ff' };
  };

  const handleEditBudgetClick = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setNewBudgetCategory(budget.category);
    setNewBudgetAmount(budget.monthly_limit.toString());
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBudgetId(null);
    setNewBudgetCategory(null);
    setNewBudgetAmount('');
  };

  const handleSaveBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount || !settings) {
      Alert.alert('Error', 'Please select a category and enter an amount');
      return;
    }

    if (budgets.some((b) => b.category === newBudgetCategory && b.id !== editingBudgetId)) {
      Alert.alert('Error', 'Budget already exists for this category');
      return;
    }

    setSaving(true);
    try {
      if (editingBudgetId) {
        const updated = await budgetService.updateBudget(editingBudgetId, {
          category: newBudgetCategory,
          monthly_limit: parseFloat(newBudgetAmount),
        });
        setBudgets(budgets.map((b) => (b.id === editingBudgetId ? updated : b)));
        Alert.alert('Success', 'Budget updated');
      } else {
        const newBudget = await budgetService.addBudget({
          category: newBudgetCategory,
          monthly_limit: parseFloat(newBudgetAmount),
          currency: settings.default_currency,
        });
        setBudgets([...budgets, newBudget]);
        Alert.alert('Success', 'Budget added');
      }
      closeForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save budget');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    Alert.alert('Delete Budget', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await budgetService.deleteBudget(id);
            setBudgets(budgets.filter((b) => b.id !== id));
            Alert.alert('Success', 'Budget deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete budget');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ChevronLeft size={24} color={UI_COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budget Management</Text>
        <TouchableOpacity 
          style={styles.headerBtn} 
          onPress={() => isFormOpen ? closeForm() : setIsFormOpen(true)}
        >
          {isFormOpen ? <X size={24} color={UI_COLORS.danger} /> : <Plus size={24} color={UI_COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Add/Edit Budget Form */}
        {isFormOpen && (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>{editingBudgetId ? 'Edit Budget' : 'Add New Budget'}</Text>
              <TouchableOpacity onPress={closeForm}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.formCard}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {categories.filter((c) => !budgets.find((b) => b.category === c.id && b.id !== editingBudgetId)).map(
                  (category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setNewBudgetCategory(category.id)}
                      style={[styles.catOption, newBudgetCategory === category.id && styles.catOptionActive]}
                    >
                      <Text style={styles.catOptionIcon}>{category.icon}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
              
              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Input
                    placeholder="0.00 Limit"
                    value={newBudgetAmount}
                    onChangeText={setNewBudgetAmount}
                    keyboardType="decimal-pad"
                    editable={!saving}
                  />
                </View>
                <TouchableOpacity 
                  style={[styles.saveBtn, (!newBudgetCategory || saving) && { opacity: 0.5 }]} 
                  onPress={handleSaveBudget}
                  disabled={saving || !newBudgetCategory}
                >
                  <Text style={styles.saveBtnText}>{editingBudgetId ? 'Update' : 'Add'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Total Monthly Budget</Text>
              <Text style={styles.heroAmount}>{currencySymbol}{totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.heroIconContainer}>
              <Wallet size={24} color="#FFF" />
            </View>
          </View>
          
          <View style={styles.heroBottom}>
            <View style={styles.heroStatsRow}>
              <Text style={styles.heroStatText}>Used: {currencySymbol}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              <Text style={styles.heroStatText}>{Math.round(overallProgress * 100)}%</Text>
            </View>
            <View style={styles.heroProgressBarBg}>
              <View style={[styles.heroProgressBarFill, { width: `${Math.min(overallProgress * 100, 100)}%` as DimensionValue }]} />
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>

        {budgets.map((budget) => {
          const category = categories.find(c => c.id === budget.category);
          const isStatic = CATEGORIES.some(c => c.id === budget.category);
          const Icon = getCategoryIcon(category?.name || '');
          
          const spent = currentMonthExpenses
            .filter(e => e.category === budget.category)
            .reduce((sum, e) => sum + e.amount, 0);
          const status = getStatusInfo(spent, budget.monthly_limit);
          const progress = spent / budget.monthly_limit;

          return (
            <View key={budget.id} style={styles.budgetCard}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryInfo}>
                  <View style={[styles.iconContainer, { backgroundColor: (category?.color || UI_COLORS.textSecondary) + '20' }]}>
                    {!isStatic && category ? (
                      <Text style={{ fontSize: 24 }}>{category.icon}</Text>
                    ) : (
                      <Icon size={24} color={category?.color || UI_COLORS.textSecondary} />
                    )}
                  </View>
                  <View>
                    <Text style={styles.categoryName}>{category?.name || 'Other'}</Text>
                    <Text style={styles.allowanceText}>Monthly Allowance: {currencySymbol}{budget.monthly_limit.toLocaleString()}</Text>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleEditBudgetClick(budget)}
                  >
                    <Edit3 size={16} color={UI_COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]} 
                    onPress={() => handleDeleteBudget(budget.id)}
                  >
                    <Trash2 size={16} color={UI_COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.cardBottom}>
                <View style={styles.amountRow}>
                  <Text style={styles.spentText}>
                    <Text style={styles.amountBold}>{currencySymbol}{spent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.spentLabel}> spent</Text>
                  </Text>
                  <View style={[styles.badge, { backgroundColor: status.bgColor }]}>
                    <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Text style={[styles.percentText, { color: status.color }]}>
                    {Math.round(progress * 100)}%
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        width: `${Math.min(progress * 100, 100)}%` as DimensionValue,
                        backgroundColor: status.color 
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          );
        })}

        {budgets.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No budgets set up yet.</Text>
            <TouchableOpacity 
              style={styles.setupBtn}
              onPress={() => setIsFormOpen(true)}
            >
              <Text style={styles.setupBtnText}>Create Your First Budget</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  formContainer: {
    marginBottom: 24,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelLink: {
    fontSize: 12,
    fontWeight: '700',
    color: UI_COLORS.danger,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  categoryScroll: {
    marginBottom: 20,
  },
  catOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: UI_COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  catOptionActive: {
    backgroundColor: UI_COLORS.primaryLight,
    borderWidth: 2,
    borderColor: UI_COLORS.primary,
  },
  catOptionIcon: {
    fontSize: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: UI_COLORS.primary,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: UI_COLORS.primary,
    borderRadius: 32,
    padding: 24,
    marginBottom: 32,
    ...Platform.select({
      ios: {
        shadowColor: UI_COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  heroAmount: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '800',
  },
  heroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroBottom: {
    marginTop: 'auto',
  },
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroStatText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heroProgressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  heroProgressBarFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  budgetCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginBottom: 2,
  },
  allowanceText: {
    fontSize: 12,
    color: UI_COLORS.textSecondary,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: UI_COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardBottom: {
    marginTop: 0,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  spentText: {
    fontSize: 14,
    flex: 1,
  },
  amountBold: {
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  spentLabel: {
    color: UI_COLORS.textSecondary,
    fontWeight: '500',
  },
  percentText: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: UI_COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: UI_COLORS.textSecondary,
    marginBottom: 24,
    fontWeight: '500',
  },
  setupBtn: {
    backgroundColor: UI_COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 16,
  },
  setupBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
