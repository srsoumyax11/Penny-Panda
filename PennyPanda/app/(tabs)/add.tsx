import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, SafeAreaView, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { expenseService, settingsService } from '@/lib/storage';
import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CURRENCIES, PAYMENT_METHODS } from '@/constants';
import { Calendar, AlignLeft, X, Wallet } from 'lucide-react-native';

import { UI_COLORS } from '@/constants/theme';

// Helper to format as DD/MM/YYYY
const formatDateString = (d: Date) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  
  // Date State
  const [dateObj, setDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setCurrency(settings.default_currency);
      const symbol = CURRENCIES.find(c => c.code === settings.default_currency)?.symbol || '$';
      setCurrencySymbol(symbol);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!amount) newErrors.amount = 'Amount is required';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Please enter a valid amount';
    if (!category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddExpense = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await expenseService.addExpense({
        amount: parseFloat(amount),
        currency,
        category: category!,
        description: description || null,
        date: dateObj.toISOString(),
        payment_method: paymentMethod,
        receipt_url: null,
      });

      setAmount('');
      setDescription('');
      setCategory(null);
      setDateObj(new Date());
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dateObj;
    setShowDatePicker(Platform.OS === 'ios');
    setDateObj(currentDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => router.push('/(tabs)')}>
          <X size={24} color="#334155" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Expense</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>
        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>AMOUNT</Text>
          <View style={styles.amountInputRow}>
            <Text style={styles.amountCurrency}>{currencySymbol}</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor="#E2E8F0"
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>
          {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
        </View>
        <CategoryPicker selectedCategory={category} onSelect={setCategory} />
        {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
        <View style={styles.inputSection}>
           <Text style={styles.sectionLabel}>DATE</Text>
           <TouchableOpacity 
             style={styles.iconInputBox} 
             onPress={() => setShowDatePicker(true)}
             activeOpacity={0.7}
           >
              <Calendar color="#94A3B8" size={20} style={styles.inputIcon} />
              <Text style={styles.iconInputText}>
                {formatDateString(dateObj)}
              </Text>
              <Calendar color="#334155" size={20} style={styles.inputIconRight} />
           </TouchableOpacity>
           
           {showDatePicker && (
             <DateTimePicker
               value={dateObj}
               mode="date"
               display="default"
               onChange={onDateChange}
               maximumDate={new Date()}
             />
           )}
         </View>

        <View style={styles.inputSection}>
           <Text style={styles.sectionLabel}>PAYMENT METHOD</Text>
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false} 
             contentContainerStyle={styles.paymentMethodsRow}
           >
             {PAYMENT_METHODS.map(method => (
               <TouchableOpacity
                 key={method.id}
                 style={[
                   styles.paymentPill,
                   paymentMethod === method.id && styles.paymentPillActive
                 ]}
                 onPress={() => setPaymentMethod(method.id)}
               >
                 <Text style={styles.paymentIcon}>{method.icon}</Text>
                 <Text style={[
                   styles.paymentText,
                   paymentMethod === method.id && styles.paymentTextActive
                 ]}>
                   {method.name}
                 </Text>
               </TouchableOpacity>
             ))}
           </ScrollView>
        </View>

        <View style={styles.inputSection}>
           <Text style={styles.sectionLabel}>NOTE</Text>
           <View style={styles.iconInputBox}>
              <AlignLeft color="#94A3B8" size={20} style={styles.inputIcon} />
              <TextInput
                 style={styles.iconInput}
                 value={description}
                 onChangeText={setDescription}
                 placeholder="What was this for?"
                 placeholderTextColor="#94A3B8"
                 editable={!loading}
              />
           </View>
        </View>

        <View style={styles.spacer} />
        <Button
          title={loading ? 'Saving...' : 'Save Expense'}
          onPress={handleAddExpense}
          disabled={loading}
          style={styles.saveBtn}
        />
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
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9', // Subtle gray
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: UI_COLORS.textMain,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 24,
    paddingBottom: 40,
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 16,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountCurrency: {
    fontSize: 48,
    fontWeight: '600',
    color: UI_COLORS.primary, // Teal
    marginRight: 8,
  },
  amountInput: {
    fontSize: 72,
    fontWeight: '700',
    color: UI_COLORS.textMain,
    minWidth: 160,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  iconInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconRight: {
    marginLeft: 12,
  },
  iconInputText: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  iconInput: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
  spacer: {
    height: 32,
  },
  saveBtn: {
    paddingVertical: 18,
    borderRadius: 16,
  },
  paymentMethodsRow: {
    paddingVertical: 4,
  },
  paymentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentPillActive: {
    backgroundColor: '#EEF2FF',
    borderColor: UI_COLORS.primary,
  },
  paymentIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  paymentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentTextActive: {
    color: UI_COLORS.primary,
  },
});
