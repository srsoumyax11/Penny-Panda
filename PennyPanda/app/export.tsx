import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Calendar, Download, FileText, Share2, CheckCircle2 } from 'lucide-react-native';
import { expenseService } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import { UI_COLORS } from '@/constants/theme';
import { CATEGORIES } from '@/constants';
import { Expense } from '@/types';

export default function ExportScreen() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  const [expenseCount, setExpenseCount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    updatePreview();
  }, [startDate, endDate]);

  const updatePreview = async () => {
    setLoading(true);
    try {
      const allExpenses = await expenseService.getExpenses({
        startDate,
        endDate: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59),
      });
      setExpenseCount(allExpenses.length);
      setTotalAmount(allExpenses.reduce((sum, exp) => sum + exp.amount, 0));
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (expenseCount === 0) {
      Alert.alert('No Data', 'There are no expenses in the selected date range.');
      return;
    }

    setExporting(true);
    try {
      const expenses = await expenseService.getExpenses({
        startDate,
        endDate: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59),
      });

      const html = generateHTML(expenses);
      const { uri } = await Print.printToFileAsync({ html });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Export PennyPanda Report',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Success', 'PDF generated! However, sharing is not available on this device.');
      }
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Failed to generate PDF');
    } finally {
      setExporting(false);
    }
  };

  const generateHTML = (expenses: Expense[]) => {
    const formatDate = (date: string) => new Date(date).toLocaleDateString();
    const currency = expenses[0]?.currency || 'USD';
    
    // Group by category for summary
    const categoryTotals = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);

    const rows = expenses.map(exp => `
      <tr>
        <td>${formatDate(exp.date)}</td>
        <td>${CATEGORIES.find(c => c.id === exp.category)?.name || exp.category}</td>
        <td>${exp.description || '-'}</td>
        <td style="text-align: right;">${exp.amount.toFixed(2)}</td>
      </tr>
    `).join('');

    const summaryRows = Object.entries(categoryTotals).map(([cat, total]) => `
      <tr>
        <td>${CATEGORIES.find(c => c.id === cat)?.name || cat}</td>
        <td style="text-align: right;">${total.toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #334155; }
            .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 28px; font-weight: bold; color: #1e293b; margin: 0; }
            .subtitle { font-size: 14px; color: #64748b; margin-top: 5px; }
            .summary-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; padding: 12px; background: #f1f5f9; color: #475569; font-size: 12px; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
            .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #94a3b8; }
            .total-row { font-weight: bold; background: #eef2ff; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">PennyPanda Financial Report</h1>
            <p class="subtitle">Generated for ${session?.name || 'User'} (${session?.email})</p>
            <p class="subtitle">Range: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
          </div>

          <div class="summary-box">
            <h2 style="font-size: 18px; margin-top: 0;">Report Summary</h2>
            <p>Total Transactions: <strong>${expenses.length}</strong></p>
            <p>Total Spending: <strong style="color: #6366f1;">${totalAmount.toFixed(2)} ${currency}</strong></p>
            
            <table style="width: 50%;">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style="text-align: right;">Spent</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>
          </div>

          <h2 style="font-size: 18px;">Transaction Details</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th style="text-align: right;">Amount (${currency})</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="total-row">
                <td colspan="3">TOTAL</td>
                <td style="text-align: right;">${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Generated by PennyPanda App • ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  };

  const setRange = (type: 'month' | '3month' | 'year') => {
    const now = new Date();
    setEndDate(now);
    if (type === 'month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth(), 1));
    } else if (type === '3month') {
      setStartDate(new Date(now.getFullYear(), now.getMonth() - 3, 1));
    } else if (type === 'year') {
      setStartDate(new Date(now.getFullYear(), 0, 1));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <ChevronLeft color={UI_COLORS.textMain} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Export Report</Text>
        <View style={styles.headerBtn} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Range</Text>
          
          <View style={styles.pickerRow}>
            <TouchableOpacity 
              style={styles.dateBtn} 
              onPress={() => setShowStartPicker(true)}
            >
              <Calendar size={18} color={UI_COLORS.primary} style={styles.btnIcon} />
              <View>
                <Text style={styles.dateLabel}>Start Date</Text>
                <Text style={styles.dateValue}>{startDate.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.arrowBox}>
              <View style={styles.arrowLine} />
            </View>

            <TouchableOpacity 
              style={styles.dateBtn} 
              onPress={() => setShowEndPicker(true)}
            >
              <Calendar size={18} color={UI_COLORS.primary} style={styles.btnIcon} />
              <View>
                <Text style={styles.dateLabel}>End Date</Text>
                <Text style={styles.dateValue}>{endDate.toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.quickRangeRow}>
            <TouchableOpacity style={styles.rangePill} onPress={() => setRange('month')}>
              <Text style={styles.rangePillText}>This Month</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rangePill} onPress={() => setRange('3month')}>
              <Text style={styles.rangePillText}>Last 3 Months</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rangePill} onPress={() => setRange('year')}>
              <Text style={styles.rangePillText}>This Year</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, styles.previewCard]}>
          <Text style={styles.cardTitle}>Report Preview</Text>
          {loading ? (
            <ActivityIndicator color={UI_COLORS.primary} style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.previewStats}>
              <View style={styles.statItem}>
                <FileText size={24} color={UI_COLORS.textSecondary} />
                <Text style={styles.statValue}>{expenseCount}</Text>
                <Text style={styles.statLabel}>Expenses Found</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <CheckCircle2 size={24} color={UI_COLORS.success} />
                <Text style={styles.statValue}>${totalAmount.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Value</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity 
          style={[styles.exportBtn, expenseCount === 0 && styles.exportBtnDisabled]} 
          onPress={handleExportPDF}
          disabled={exporting || expenseCount === 0}
        >
          {exporting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Share2 size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.exportBtnText}>Generate & Share PDF</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          The PDF will include a summary of category spending and a full list of all transactions within the selected range.
        </Text>
      </ScrollView>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(false);
            if (date) setStartDate(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(false);
            if (date) setEndDate(date);
          }}
        />
      )}
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
    paddingTop: 60,
    paddingBottom: 16,
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
    padding: 24,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginBottom: 20,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  btnIcon: {
    marginRight: 10,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: UI_COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: UI_COLORS.textMain,
  },
  arrowBox: {
    width: 30,
    alignItems: 'center',
  },
  arrowLine: {
    width: 15,
    height: 2,
    backgroundColor: '#e2e8f0',
  },
  quickRangeRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
  },
  rangePill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#eef2ff',
  },
  rangePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: UI_COLORS.primary,
  },
  previewCard: {
    borderWidth: 1,
    borderColor: '#eef2ff',
    backgroundColor: '#FAFAFD',
  },
  previewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e2e8f0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: UI_COLORS.textMain,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: UI_COLORS.textSecondary,
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: UI_COLORS.primary,
    height: 60,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: UI_COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  exportBtnDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    marginTop: 20,
    fontSize: 12,
    color: UI_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
