import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '@/db/types';
import { useAppTheme } from '@/theme';

interface CategoryPickerProps {
  categories: Category[];
  selectedCategoryId?: number;
  onSelectCategory: (categoryId: number) => void;
  error?: string;
}

export function CategoryPicker({
  categories,
  selectedCategoryId,
  onSelectCategory,
  error,
}: CategoryPickerProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.label,
          {
            color: colors.textSecondary,
            fontSize: typography.sizes.sm,
            marginBottom: spacing.xs,
          },
        ]}
      >
        Category
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.xs }}
      >
        {categories.map((cat) => {
          const isSelected = cat.id === selectedCategoryId;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectCategory(cat.id)}
              style={[
                styles.chip,
                {
                  borderRadius: radii.full,
                  borderColor: isSelected ? cat.color : colors.border,
                  backgroundColor: isSelected ? `${cat.color}20` : colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.dot,
                  { backgroundColor: cat.color, borderRadius: radii.full },
                ]}
              >
                <Ionicons
                  name={(cat.icon as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                  size={12}
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isSelected ? colors.textPrimary : colors.textSecondary,
                    fontSize: typography.sizes.sm,
                    fontWeight: isSelected
                      ? typography.weights.bold
                      : typography.weights.regular,
                  },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {error ? (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.danger,
              fontSize: typography.sizes.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  dot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  chipText: {},
  errorText: {
    fontWeight: '500',
  },
});
