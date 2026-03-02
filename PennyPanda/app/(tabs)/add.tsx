import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { expenseService, settingsService } from '@/lib/supabase';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { CategoryPicker } from '@/components/CategoryPicker';
import { CURRENCIES } from '@/constants';
import { Camera, X } from 'lucide-react-native';

export default function AddExpenseScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await settingsService.getSettings();
      setCurrency(settings.default_currency);
    } catch (err) {
      console.error('Failed to load settings:', err);
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

  const handleAddExpense = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await expenseService.addExpense({
        amount: parseFloat(amount),
        currency,
        category: category!,
        description: description || null,
        date: new Date(date).toISOString(),
        receipt_url: receiptImage || null,
      });

      Alert.alert('Success', 'Expense added successfully!');
      setAmount('');
      setDescription('');
      setCategory(null);
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptImage(null);
      router.push('/(tabs)');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const handleTakePhoto = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
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

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView style={styles.camera} facing="back">
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => setShowCamera(false)}>
              <X color="#FFFFFF" size={32} />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
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
          editable={!loading}
          error={errors.amount}
        />

        <View style={styles.currencyContainer}>
          <Text style={styles.label}>Currency</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.currencyScroll}>
            {CURRENCIES.map((curr) => (
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
          </ScrollView>
        </View>

        <Input
          label="Description (Optional)"
          placeholder="What did you spend on?"
          value={description}
          onChangeText={setDescription}
          editable={!loading}
          multiline
        />

        <Input
          label="Date"
          placeholder="YYYY-MM-DD"
          value={date}
          onChangeText={setDate}
          editable={!loading}
        />

        <View style={styles.receiptSection}>
          <Text style={styles.label}>Receipt (Optional)</Text>
          {receiptImage && (
            <View style={styles.receiptPreview}>
              <Text style={styles.receiptText}>Receipt uploaded</Text>
              <TouchableOpacity onPress={() => setReceiptImage(null)}>
                <Text style={styles.removeReceipt}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          {!receiptImage && (
            <View style={styles.receiptButtons}>
              <Button
                title="Take Photo"
                variant="outline"
                onPress={handleTakePhoto}
                style={styles.receiptButton}
              />
              <Button
                title="Choose Image"
                variant="outline"
                onPress={handlePickImage}
                style={styles.receiptButton}
              />
            </View>
          )}
        </View>

        <Button
          title={loading ? 'Adding Expense...' : 'Add Expense'}
          onPress={handleAddExpense}
          disabled={loading}
          style={styles.submitButton}
        />
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
    flexGrow: 0,
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
  receiptSection: {
    marginBottom: 24,
  },
  receiptButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  receiptButton: {
    flex: 1,
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
  submitButton: {
    marginTop: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraHeader: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
