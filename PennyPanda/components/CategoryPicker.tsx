import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native';
import { CATEGORIES } from '@/constants';

interface CategoryPickerProps {
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

export function CategoryPicker({ selectedCategory, onSelect }: CategoryPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[
              styles.categoryButton,
              selectedCategory === category.id && styles.selectedCategory,
            ]}
          >
            <Text style={styles.icon}>{category.icon}</Text>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  scroll: {
    flexGrow: 0,
  },
  categoryButton: {
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  selectedCategory: {
    borderColor: '#000000',
    backgroundColor: '#F0F0F0',
  },
  icon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
  },
});
