import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { budgetService, settingsService, expenseService } from '@/lib/storage';
import { Budget, UserSettings } from '@/types';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CATEGORIES, CURRENCIES, BUDGET_ALERT_PERCENTAGE } from '@/constants';
import { Trash2 } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState<string | null>(null);
  const [newBudgetAmount, setNewBudgetAmount] = useState('');
  const [expenses, setExpenses] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const settingsData = await settingsService.getSettings();
      setSettings(settingsData);

      const budgetsData = await budgetService.getBudgets();
      setBudgets(budgetsData);

      const expensesData = await expenseService.getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateSettings({ default_currency: currency });
      setSettings({ ...settings, default_currency: currency });
    } catch (error) {
      Alert.alert('Error', 'Failed to update currency');
    } finally {
      setSaving(false);
    }
  };

  const handleBudgetAlertToggle = async (value: boolean) => {
    if (!settings) return;
    setSaving(true);
    try {
      await settingsService.updateSettings({ budget_alert_enabled: value });
      setSettings({ ...settings, budget_alert_enabled: value });
    } catch (error) {
      Alert.alert('Error', 'Failed to update alert setting');
    } finally {
      setSaving(false);
    }
  };

  const handleAddBudget = async () => {
    if (!newBudgetCategory || !newBudgetAmount || !settings) {
      Alert.alert('Error', 'Please select a category and enter an amount');
      return;
    }

    if (budgets.some((b) => b.category === newBudgetCategory)) {
      Alert.alert('Error', 'Budget already exists for this category');
      return;
    }

    setSaving(true);
    try {
      const newBudget = await budgetService.addBudget({
        category: newBudgetCategory,
        monthly_limit: parseFloat(newBudgetAmount),
        currency: settings.default_currency,
      });
      setBudgets([...budgets, newBudget]);
      setNewBudgetCategory(null);
      setNewBudgetAmount('');
      Alert.alert('Success', 'Budget added');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add budget');
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
          } catch (error) {
            Alert.alert('Error', 'Failed to delete budget');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/auth/signin');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const getBudgetStatus = (budget: Budget) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categoryExpenses = expenses.filter(
      (e) =>
        e.category === budget.category &&
        new Date(e.date) >= startOfMonth &&
        new Date(e.date) <= endOfMonth
    );

    const spent = categoryExpenses.reduce((sum, e) => sum + e.amount, 0);
    const percentage = (spent / budget.monthly_limit) * 100;

    return { spent, percentage };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>Default Currency</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.currencyList}
            >
              {CURRENCIES.map((curr) => (
                <TouchableOpacity
                  key={curr.code}
                  onPress={() => handleCurrencyChange(curr.code)}
                  style={[
                    styles.currencyButton,
                    settings?.default_currency === curr.code && styles.currencyButtonActive,
                  ]}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.currencyButtonText,
                      settings?.default_currency === curr.code &&
                        styles.currencyButtonTextActive,
                    ]}
                  >
                    {curr.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>

          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Budget Alerts</Text>
              <Switch
                value={settings?.budget_alert_enabled ?? true}
                onValueChange={handleBudgetAlertToggle}
                disabled={saving}
              />
            </View>
            <Text style={styles.settingDescription}>
              Get notified when spending exceeds {BUDGET_ALERT_PERCENTAGE}% of budget
            </Text>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Budgets</Text>

          {budgets.map((budget) => {
            const status = getBudgetStatus(budget);
            const categoryInfo = CATEGORIES.find((c) => c.id === budget.category);
            const isAlert = status.percentage >= BUDGET_ALERT_PERCENTAGE;

            return (
              <Card
                key={budget.id}
                style={[styles.budgetCard, isAlert ? styles.budgetCardAlert : undefined] as any}
              >
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetInfo}>
                    <Text style={styles.budgetIcon}>{categoryInfo?.icon || '📌'}</Text>
                    <Text style={styles.budgetCategory}>{categoryInfo?.name || 'Other'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)}>
                    <Trash2 size={18} color="#FF0000" />
                  </TouchableOpacity>
                </View>

                <View style={styles.budgetProgress}>
                  <View style={styles.budgetProgressBar}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(status.percentage, 100)}%`,
                          backgroundColor: isAlert ? '#FF0000' : '#000000',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.budgetPercentage}>{status.percentage.toFixed(0)}%</Text>
                </View>

                <View style={styles.budgetAmount}>
                  <Text style={styles.budgetSpent}>
                    Spent: {settings?.default_currency === budget.currency ? '$' : ''} {status.spent.toFixed(2)}
                  </Text>
                  <Text style={styles.budgetLimit}>
                    Limit: {settings?.default_currency === budget.currency ? '$' : ''} {budget.monthly_limit.toFixed(2)}
                  </Text>
                </View>
              </Card>
            );
          })}

          <Card style={styles.addBudgetCard}>
            <Text style={styles.addBudgetTitle}>Add Budget</Text>

            <View style={styles.categorySelector}>
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryList}
              >
                {CATEGORIES.filter((c) => !budgets.find((b) => b.category === c.id)).map(
                  (category) => (
                    <TouchableOpacity
                      key={category.id}
                      onPress={() => setNewBudgetCategory(category.id)}
                      style={[
                        styles.categoryOption,
                        newBudgetCategory === category.id && styles.categoryOptionActive,
                      ]}
                    >
                      <Text style={styles.categoryOptionIcon}>{category.icon}</Text>
                      <Text style={styles.categoryOptionName}>{category.name}</Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </View>

            <Input
              label="Monthly Limit"
              placeholder="0.00"
              value={newBudgetAmount}
              onChangeText={setNewBudgetAmount}
              keyboardType="decimal-pad"
              editable={!saving}
            />

            <Button
              title={saving ? 'Adding...' : 'Add Budget'}
              onPress={handleAddBudget}
              disabled={saving || !newBudgetCategory}
              variant={newBudgetCategory ? 'primary' : 'secondary'}
            />
          </Card>
        </View>

        <View style={styles.section}>
          <Button
            title="Sign Out"
            variant="danger"
            onPress={handleSignOut}
            disabled={saving}
          />
        </View>
      </ScrollView>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingCard: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  currencyList: {
    marginBottom: 0,
  },
  currencyButton: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  currencyButtonActive: {
    borderColor: '#000000',
    backgroundColor: '#F0F0F0',
  },
  currencyButtonText: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  currencyButtonTextActive: {
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  budgetCard: {
    marginBottom: 12,
  },
  budgetCardAlert: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF0000',
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  budgetCategory: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  budgetProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  budgetProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  budgetProgressFill: {
    height: '100%',
  },
  budgetPercentage: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    minWidth: 36,
  },
  budgetAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetSpent: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
  budgetLimit: {
    fontSize: 12,
    color: '#666666',
  },
  addBudgetCard: {
    paddingVertical: 16,
  },
  addBudgetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  categorySelector: {
    marginBottom: 16,
  },
  categoryList: {
    marginBottom: 0,
  },
  categoryOption: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  categoryOptionActive: {
    borderColor: '#000000',
    backgroundColor: '#F0F0F0',
  },
  categoryOptionIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryOptionName: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '500',
  },
});
