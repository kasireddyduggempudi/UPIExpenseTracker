import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface CategorySelectorProps {
  categories: string[];
  selectedCategory: string;
  onChange: (category: string) => void;
}

export const CategorySelector = ({
  categories,
  selectedCategory,
  onChange,
}: CategorySelectorProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <View style={styles.rowWrap}>
        {categories.map(category => {
          const isSelected = selectedCategory === category;
          return (
            <TouchableOpacity
              key={category}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onChange(category)}>
              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#1e293b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  chipSelected: {
    backgroundColor: '#115e59',
    borderColor: '#115e59',
  },
  chipText: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
});
