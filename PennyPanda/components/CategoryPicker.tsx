import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Image } from 'react-native';
import { CATEGORIES } from '@/constants';
import { ShoppingBag, Utensils, Zap, Car, Home as HomeIcon, Film, DollarSign } from 'lucide-react-native';

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
};

export function CategoryPicker({ selectedCategory, onSelect }: CategoryPickerProps) {
  // Take 8 categories maximally for a 4x2 grid
  const displayCats = CATEGORIES.slice(0, 8);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CATEGORY</Text>
      <View style={styles.grid}>
        {displayCats.map((category) => {
          const theme = CATEGORY_MAP[category.name.toLowerCase()] || { bg: '#F8FAFC', color: '#EAB308', Icon: DollarSign, short: 'Other' };
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
                <IconComp size={24} color={theme.color} strokeWidth={2.5}/>
              </View>
              <Text style={styles.categoryName}>{theme.short}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
});
