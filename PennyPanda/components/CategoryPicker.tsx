import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image, Modal, TextInput, ScrollView, Alert } from 'react-native';
import { CATEGORIES } from '@/constants';
import { ShoppingBag, Utensils, Zap, Car, Home as HomeIcon, Film, DollarSign, Plus, X } from 'lucide-react-native';
import { categoryService } from '@/lib/storage';
import { Category } from '@/types';
import { UI_COLORS } from '@/constants/theme';

interface CategoryPickerProps {
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

// Temporary mapping until SVG assets are available. Using colored Lucide icons with solid backgrounds similar to mockup.
const CATEGORY_MAP: Record<string, { bg: string, color: string, Icon: React.ElementType, short: string }> = {
  'food': { bg: '#FFF7ED', color: '#F97316', Icon: Utensils, short: 'Food' },
  'food & dining': { bg: '#FFF7ED', color: '#F97316', Icon: Utensils, short: 'Food' },
  'transport': { bg: '#EFF6FF', color: '#3B82F6', Icon: Car, short: 'Travel' },
  'shopping': { bg: '#F0FDF4', color: '#22C55E', Icon: ShoppingBag, short: 'Shop' },
  'entertainment': { bg: '#FDF2F8', color: '#EC4899', Icon: Film, short: 'Fun' },
  'health': { bg: '#FEF2F2', color: '#EF4444', Icon: Zap, short: 'Health' },
  'utilities': { bg: '#F8FAFC', color: '#64748B', Icon: Zap, short: 'Subs' },
  'home': { bg: '#FAF5FF', color: '#A855F7', Icon: HomeIcon, short: 'Home' },
  'demo': { bg: '#F8FAFC', color: '#64748B', Icon: Zap, short: 'Demo' },
  'Dog': { bg: '#F1F5F9', color: '#64748B', Icon: Zap, short: 'Dog' },
};

export function CategoryPicker({ selectedCategory, onSelect }: CategoryPickerProps) {
  const [customCats, setCustomCats] = useState<Category[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('📌');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCustomCategories();
      setCustomCats(data);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    setLoading(true);
    try {
      const newCat = await categoryService.addCategory({
        name: newCatName.trim(),
        icon: newCatEmoji,
        color: '#6366f1', // Default branding color
      });
      
      setCustomCats([...customCats, newCat]);
      onSelect(newCat.id);
      setShowAddModal(false);
      setNewCatName('');
      setNewCatEmoji('📌');
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setLoading(false);
    }
  };

  const allCategories = [...CATEGORIES, ...customCats];
  // Show first 11 categories + the "Add New" button for a total of 12 (3 rows of 4)
  const displayCats = allCategories.slice(0, 11);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.grid}>
        {displayCats.map((category) => {
          const isStatic = CATEGORIES.some(c => c.id === category.id);
          const theme = isStatic 
            ? CATEGORY_MAP[category.name.toLowerCase()] || { bg: '#F8FAFC', color: '#64748B', Icon: DollarSign, short: category.name }
            : { bg: '#F5F3FF', color: '#6366f1', Icon: null, short: category.name };
          
          const IconComp = theme.Icon;
          const isActive = selectedCategory === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelect(category.id)}
              style={[
                styles.categoryButton,
                isActive && styles.selectedCategory,
              ]}
            >
              <View style={[styles.iconWrapper, { backgroundColor: theme.bg }]}>
                {IconComp ? (
                  <IconComp size={20} color={theme.color} strokeWidth={2.5}/>
                ) : (
                  <Text style={{ fontSize: 20 }}>{category.icon}</Text>
                )}
              </View>
              <Text style={styles.categoryName} numberOfLines={1}>{theme.short}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.categoryButton}
        >
          <View style={[styles.iconWrapper, { backgroundColor: '#F1F5F9' }]}>
            <Plus size={20} color="#64748B" strokeWidth={2.5}/>
          </View>
          <Text style={styles.categoryName}>Add New</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Category</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>CATEGORY NAME</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Gifts, Subscriptions"
                value={newCatName}
                onChangeText={setNewCatName}
                autoFocus
              />

              <Text style={styles.inputLabel}>CHOOSE EMOJI</Text>
              <View style={styles.emojiRow}>
                {['📌', '🎁', '💊', '🎮', '💡', '🎾', '🍕', '🚌'].map(emoji => (
                  <TouchableOpacity 
                    key={emoji} 
                    onPress={() => setNewCatEmoji(emoji)}
                    style={[
                      styles.emojiButton,
                      newCatEmoji === emoji && styles.selectedEmoji
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity 
                style={[styles.addBtn, loading && styles.addBtnDisabled]}
                onPress={handleAddCategory}
                disabled={loading}
              >
                <Text style={styles.addBtnText}>
                  {loading ? 'Adding...' : 'Create Category'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '22%', // Roughly 4 items per row
    aspectRatio: 0.85,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 8,
  },
  selectedCategory: {
    borderColor: '#14B8A6', // Teal highlighted border
    backgroundColor: '#F0FDFA', // Super light teal tint
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  modalBody: {
    gap: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    color: '#1e293b',
  },
  emojiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  emojiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedEmoji: {
    borderColor: '#6366f1',
    backgroundColor: '#EEF2FF',
  },
  addBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  addBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
