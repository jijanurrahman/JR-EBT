import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TransactionType } from '@/db/types';
import { useAppTheme } from '@/theme';
import { TextField } from '@/components';

interface TransactionFiltersBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  selectedType: TransactionType | 'all';
  onTypeChange: (type: TransactionType | 'all') => void;
}

export function TransactionFiltersBar({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
}: TransactionFiltersBarProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const options: Array<{ label: string; value: TransactionType | 'all' }> = [
    { label: 'All', value: 'all' },
    { label: 'Expenses', value: 'expense' },
    { label: 'Income', value: 'income' },
  ];

  return (
    <View style={styles.container}>
      <TextField
        value={search}
        onChangeText={onSearchChange}
        placeholder="Search notes or categories..."
        clearButtonMode="while-editing"
        containerStyle={{ marginBottom: spacing.sm }}
      />

      <View
        style={[
          styles.toggleContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.md,
            padding: spacing.xxs,
          },
        ]}
      >
        {options.map((opt) => {
          const isActive = selectedType === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onTypeChange(opt.value)}
              style={[
                styles.toggleButton,
                {
                  borderRadius: radii.sm,
                  backgroundColor: isActive ? colors.primary : 'transparent',
                  paddingVertical: spacing.xs + 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  {
                    color: isActive ? colors.textInverse : colors.textSecondary,
                    fontSize: typography.sizes.sm,
                    fontWeight: isActive
                      ? typography.weights.bold
                      : typography.weights.medium,
                  },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {},
});

