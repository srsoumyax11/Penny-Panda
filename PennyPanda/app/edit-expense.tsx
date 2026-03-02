import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { expenseService } from '@/lib/storage';
import { Expense } from '@/types';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CURRENCIES } from '@/constants';

export default function EditExpenseScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadExpense();
    }
  }, [id]);

  const loadExpense = async () => {
    if (!id) return;
    try {
      const allExpenses = await expenseService.getExpenses();
      const data = allExpenses.find(e => e.id === id);
      if (data) {
        setExpense(data);
        setAmount(data.amount.toString());
        setDescription(data.description || '');
        setCategory(data.category);
        setDate(new Date(data.date).toISOString().split('T')[0]);
        setCurrency(data.currency);
        setReceiptImage(data.receipt_url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load expense');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!amount) newErrors.amount = 'Amount is required';
    if (isNaN(parseFloat(amount))) newErrors.amount = 'Please enter a valid amount';
    if (!category) newErrors.category = 'Category is required';
    if (!date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateExpense = async () => {
    if (!validateForm() || !expense) return;

    setSaving(true);
    try {
      await expenseService.updateExpense(expense.id, {
        amount: parseFloat(amount),
        currency,
        category,
        description: description || null,
        date: new Date(date).toISOString(),
        receipt_url: receiptImage,
      } as Partial<Expense>);

      Alert.alert('Success', 'Expense updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update expense');
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].base64) {
      setReceiptImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <CategoryPicker selectedCategory={category} onSelect={setCategory} />

        <Input
          label="Amount"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          editable={!saving}
          error={errors.amount}
        />

        <View style={styles.currencyContainer}>
          <Text style={styles.label}>Currency</Text>
          <View style={styles.currencyScroll}>
            {CURRENCIES.slice(0, 5).map((curr) => (
              <TouchableOpacity
                key={curr.code}
                onPress={() => setCurrency(curr.code)}
                style={[
                  styles.currencyButton,
                  currency === curr.code && styles.currencyButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    currency === curr.code && styles.currencyButtonTextActive,
                  ]}
                >
                  {curr.code}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Input
          label="Description"
          placeholder="What did you spend on?"
          value={description}
          onChangeText={setDescription}
          editable={!saving}
          multiline
        />

        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          editable={!saving}
        />

        <View style={styles.receiptSection}>
          <Text style={styles.label}>Receipt</Text>
          {receiptImage && (
            <View style={styles.receiptPreview}>
              <Text style={styles.receiptText}>Receipt available</Text>
              <TouchableOpacity onPress={() => setReceiptImage(null)}>
                <Text style={styles.removeReceipt}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          {!receiptImage && (
            <Button
              title="Add Receipt"
              variant="outline"
              onPress={handlePickImage}
              style={styles.receiptButton}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title={saving ? 'Saving...' : 'Save Changes'}
            onPress={handleUpdateExpense}
            disabled={saving}
            style={styles.submitButton}
          />
          <Button
            title="Cancel"
            variant="secondary"
            onPress={() => router.back()}
            disabled={saving}
            style={styles.cancelButton}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  currencyContainer: {
    marginBottom: 16,
  },
  currencyScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  currencyButton: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  receiptSection: {
    marginBottom: 24,
  },
  receiptButton: {
    marginBottom: 16,
  },
  receiptPreview: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 4,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    marginBottom: 16,
  },
  receiptText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  removeReceipt: {
    fontSize: 12,
    color: '#FF0000',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 8,
  },
  submitButton: {},
  cancelButton: {},
});
