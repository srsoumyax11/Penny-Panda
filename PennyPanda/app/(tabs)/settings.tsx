import React, { useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { budgetService, settingsService, expenseService } from '@/lib/storage';
import { Budget, UserSettings } from '@/types';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CATEGORIES, CURRENCIES, BUDGET_ALERT_PERCENTAGE } from '@/constants';
import { Trash2, ChevronLeft, Edit3, Globe, Bell, Moon, LogOut, ChevronRight, User, Shield, CreditCard } from 'lucide-react-native';

const UI_COLORS = {
  background: '#FAFAFD',
  surface: '#FFFFFF',
  textMain: '#1e293b',    // Slate 800
  textSecondary: '#64748b', // Slate 500
  primary: '#6366f1',     // Indigo 500, soft blurple matching the mockup
  primaryLight: '#e0e7ff',// Indigo 100
  border: '#f1f5f9',      // Slate 100
  danger: '#ef4444',
  success: '#10b981',
};

// Map currency codes to symbols/flags if needed, using Globe by default
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
          <Text style={styles.loadingText}>Loading account info...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <ChevronLeft color={UI_COLORS.textMain} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarInner}>
               {/* Using a placeholder avatar. In a real app we'd load user.photoURL */}
               <Image 
                 source={{ uri: 'https://i.pravatar.cc/300?img=11' }} 
                 style={styles.avatarImage} 
               />
               <TouchableOpacity style={styles.editAvatarBtn}>
                 <Edit3 color="#FFFFFF" size={14} />
               </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.profileName}>Alex Panda</Text>
          <Text style={styles.profileEmail}>alex.panda@example.com</Text>
        </View>

        {/* Preferences Block */}
        <View style={styles.cardBlock}>
           {/* Currency Item */}
           <View style={styles.cardItem}>
             <View style={styles.itemRow}>
               <View style={[styles.itemIconBox, { backgroundColor: '#e0e7ff' }]}>
                 <Globe color="#6366f1" size={20} />
               </View>
               <Text style={styles.itemTextLeft}>Default Currency</Text>
             </View>
             
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll} snapToInterval={60} decelerationRate="fast">
               {CURRENCIES.map((curr) => (
                 <TouchableOpacity
                   key={curr.code}
                   onPress={() => handleCurrencyChange(curr.code)}
                   style={[styles.currencyPill, settings?.default_currency === curr.code && styles.currencyPillActive]}
                   disabled={saving}
                 >
                   <Text style={[styles.currencyPillText, settings?.default_currency === curr.code && styles.currencyPillTextActive]}>
                     {curr.code}
                   </Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
           </View>
           
           <View style={styles.divider} />

           {/* Placeholder elements matching mockup exactly */}
           <TouchableOpacity style={styles.cardItem}>
             <View style={styles.itemRow}>
               <View style={[styles.itemIconBox, { backgroundColor: '#d1fae5' }]}>
                 <CreditCard color="#10b981" size={20} />
               </View>
               <Text style={styles.itemTextLeft}>Subscription</Text>
             </View>
             <View style={styles.itemRow}>
                <Text style={styles.proLabel}>PRO</Text>
                <ChevronRight color={UI_COLORS.textSecondary} size={20} />
             </View>
           </TouchableOpacity>

           <View style={styles.divider} />

           <TouchableOpacity style={styles.cardItem}>
             <View style={styles.itemRow}>
               <View style={[styles.itemIconBox, { backgroundColor: '#fef3c7' }]}>
                 <Shield color="#f59e0b" size={20} />
               </View>
               <Text style={styles.itemTextLeft}>Security & Privacy</Text>
             </View>
             <ChevronRight color={UI_COLORS.textSecondary} size={20} />
           </TouchableOpacity>

        </View>

        {/* System Settings Block */}
        <View style={styles.cardBlock}>
           <View style={styles.cardItem}>
             <View style={styles.itemRow}>
               <View style={[styles.itemIconBox, { backgroundColor: '#e0f2fe' }]}>
                 <Bell color="#0ea5e9" size={20} />
               </View>
               <Text style={styles.itemTextLeft}>Notifications (Alerts)</Text>
             </View>
             <Switch
                value={settings?.budget_alert_enabled ?? true}
                onValueChange={handleBudgetAlertToggle}
                disabled={saving}
                trackColor={{ false: '#e2e8f0', true: UI_COLORS.primary }}
                thumbColor="#FFFFFF"
              />
           </View>
           
           <View style={styles.divider} />

           <View style={styles.cardItem}>
             <View style={styles.itemRow}>
               <View style={[styles.itemIconBox, { backgroundColor: '#f3e8ff' }]}>
                 <Moon color="#a855f7" size={20} />
               </View>
               <Text style={styles.itemTextLeft}>Dark Mode</Text>
             </View>
             <Switch
                value={false} // Placeholder for dark mode if we add it later
                onValueChange={() => {}}
                disabled={true}
                trackColor={{ false: '#e2e8f0', true: UI_COLORS.primary }}
                thumbColor="#FFFFFF"
              />
           </View>
        </View>

        {/* Budgets Block */}
        <Text style={styles.blockTitle}>Monthly Budgets</Text>
        <View style={styles.cardBlock}>
          {budgets.length === 0 && (
             <Text style={styles.emptyText}>No budgets set up yet.</Text>
          )}

          {budgets.map((budget, idx) => {
            const status = getBudgetStatus(budget);
            const categoryInfo = CATEGORIES.find((c) => c.id === budget.category);
            const isAlert = status.percentage >= BUDGET_ALERT_PERCENTAGE;

            return (
              <View key={budget.id}>
                {idx > 0 && <View style={styles.divider} />}
                <View style={styles.budgetRow}>
                  <View style={styles.budgetTop}>
                    <View style={styles.budgetInfoLeft}>
                      <Text style={styles.budgetIcon}>{categoryInfo?.icon || '📌'}</Text>
                      <Text style={styles.budgetName}>{categoryInfo?.name || 'Other'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteBudget(budget.id)} style={styles.budgetDelBtn}>
                      <Trash2 size={16} color={UI_COLORS.danger} />
                    </TouchableOpacity>
                  </View>
  
                  <View style={styles.budgetProgressRow}>
                     <View style={styles.progressBarBg}>
                        <View style={[styles.progressBarFill, { width: `${Math.min(status.percentage, 100)}%`, backgroundColor: isAlert ? UI_COLORS.danger : UI_COLORS.primary }]} />
                     </View>
                     <Text style={[styles.budgetPercentageText, isAlert && { color: UI_COLORS.danger }]}>{status.percentage.toFixed(0)}%</Text>
                  </View>
                  
                  <View style={styles.budgetAmountsRow}>
                    <Text style={styles.budgetAmountText}>
                      {settings?.default_currency === budget.currency ? '$' : ''}{status.spent.toFixed(2)} spent
                    </Text>
                    <Text style={styles.budgetAmountText}>
                      / {settings?.default_currency === budget.currency ? '$' : ''}{budget.monthly_limit.toFixed(2)} limit
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Add Budget Form (Using identical styling but standalone) */}
        <Text style={styles.blockTitle}>Add New Budget</Text>
        <View style={[styles.cardBlock, { padding: 16 }]}>
           <ScrollView
             horizontal
             showsHorizontalScrollIndicator={false}
             style={styles.categoryScroll}
           >
             {CATEGORIES.filter((c) => !budgets.find((b) => b.category === c.id)).map(
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
           
           <View style={styles.addBudgetInputRow}>
             <View style={{ flex: 1, marginRight: 8 }}>
               <Input
                 placeholder="0.00 Limit"
                 value={newBudgetAmount}
                 onChangeText={setNewBudgetAmount}
                 keyboardType="decimal-pad"
                 editable={!saving}
               />
             </View>
             <TouchableOpacity 
                style={[styles.addBudgetBtn, (!newBudgetCategory || saving) && { opacity: 0.5 }]} 
                onPress={handleAddBudget}
                disabled={saving || !newBudgetCategory}
             >
                <Text style={styles.addBudgetBtnText}>Add</Text>
             </TouchableOpacity>
           </View>
        </View>

        {/* Sign Out Button mapped perfectly to mockup */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} disabled={saving}>
           <LogOut color="#64748b" size={20} style={{ marginRight: 8 }} />
           <Text style={styles.signOutBtnText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>PENNYPANDA V2.4.0 (VARIANT 9/10)</Text>
        <View style={{ height: 40 }}/>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: UI_COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: UI_COLORS.background,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 16,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UI_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    color: UI_COLORS.textSecondary,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_COLORS.textSecondary,
    marginBottom: 12,
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardBlock: {
    backgroundColor: UI_COLORS.surface,
    borderRadius: 24,
    paddingVertical: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  itemTextLeft: {
    fontSize: 15,
    fontWeight: '600',
    color: UI_COLORS.textMain,
  },
  proLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: UI_COLORS.success,
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: UI_COLORS.border,
    marginHorizontal: 20,
  },
  currencyScroll: {
    marginLeft: 16,
  },
  currencyPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: UI_COLORS.border,
    marginRight: 8,
  },
  currencyPillActive: {
    backgroundColor: UI_COLORS.primary,
  },
  currencyPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: UI_COLORS.textSecondary,
  },
  currencyPillTextActive: {
    color: '#FFFFFF',
  },
  budgetRow: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  budgetTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  budgetName: {
    fontSize: 15,
    fontWeight: '700',
    color: UI_COLORS.textMain,
  },
  budgetDelBtn: {
    padding: 4,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
  },
  budgetProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: UI_COLORS.border,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetPercentageText: {
    fontSize: 12,
    fontWeight: '700',
    color: UI_COLORS.textSecondary,
    width: 36,
    textAlign: 'right',
  },
  budgetAmountsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  budgetAmountText: {
    fontSize: 12,
    color: UI_COLORS.textSecondary,
    fontWeight: '600',
  },
  emptyText: {
    padding: 20,
    fontSize: 14,
    color: UI_COLORS.textSecondary,
    textAlign: 'center',
  },
  categoryScroll: {
    marginBottom: 16,
  },
  catOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: UI_COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  addBudgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addBudgetBtn: {
    backgroundColor: UI_COLORS.primary,
    paddingHorizontal: 24,
    height: 52, // Match input height roughly
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBudgetBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingVertical: 18,
    marginTop: 16,
    marginBottom: 24,
  },
  signOutBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#475569',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    textTransform: 'uppercase',
  }
});
