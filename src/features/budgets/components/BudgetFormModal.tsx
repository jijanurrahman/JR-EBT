import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAllCategories, upsertBudget } from '@/db/queries';
import { BudgetWithCategory, Category } from '@/db/types';
import { centsToDecimalString, parseCentsFromString } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { Button, TextField } from '@/components';
import { CategoryPicker } from '@/features/transactions/components/CategoryPicker';
import { budgetFormSchema, BudgetFormValues } from '../schema';

interface BudgetFormModalProps {
  visible: boolean;
  month: string;
  editingBudget?: BudgetWithCategory | null;
  onClose: () => void;
  onSaved: () => void;
}

export function BudgetFormModal({
  visible,
  month,
  editingBudget,
  onClose,
  onSaved,
}: BudgetFormModalProps) {
  const { colors, spacing, radii, typography } = useAppTheme();
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    mode: 'onChange',
    defaultValues: {
      categoryId: 0,
      month,
      limit: '',
    },
  });

  useEffect(() => {
    if (!visible) return;

    getAllCategories('expense', false).then((cats) => {
      setCategories(cats);
    });

    if (editingBudget) {
      reset({
        categoryId: editingBudget.category_id,
        month,
        limit: centsToDecimalString(editingBudget.limit_cents),
      });
    } else {
      reset({
        categoryId: 0,
        month,
        limit: '',
      });
    }
  }, [visible, editingBudget, month, reset]);

  const onSubmit = async (values: BudgetFormValues) => {
    try {
      const limitCents = parseCentsFromString(values.limit);
      await upsertBudget(values.categoryId, month, limitCents);
      onSaved();
      onClose();
    } catch (err) {
      console.warn('Failed to save budget:', err);
      Alert.alert('Error', 'Failed to save budget limit.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.backdrop }]} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.xl,
              padding: spacing.xl,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text
            style={[
              styles.title,
              {
                color: colors.textPrimary,
                fontSize: typography.sizes.lg,
                fontWeight: typography.weights.bold,
                marginBottom: spacing.md,
              },
            ]}
          >
            {editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
          </Text>

          {!editingBudget ? (
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { value } }) => (
                <View style={{ marginBottom: spacing.md }}>
                  <CategoryPicker
                    categories={categories}
                    selectedCategoryId={value}
                    onSelectCategory={(id) => setValue('categoryId', id, { shouldValidate: true })}
                    error={errors.categoryId?.message}
                  />
                </View>
              )}
            />
          ) : (
            <Text
              style={[
                styles.categoryNameText,
                {
                  color: colors.textSecondary,
                  fontSize: typography.sizes.md,
                  marginBottom: spacing.md,
                  fontWeight: typography.weights.semibold,
                },
              ]}
            >
              Category: {editingBudget.category_name}
            </Text>
          )}

          <Controller
            control={control}
            name="limit"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Monthly Limit"
                placeholder="0.00"
                prefix="$"
                keyboardType="decimal-pad"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                error={errors.limit?.message}
                containerStyle={{ marginBottom: spacing.lg }}
              />
            )}
          />

          <View style={styles.actions}>
            <Button
              title="Save Limit"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="md"
              disabled={!isValid || isSubmitting}
              loading={isSubmitting}
              style={{ flex: 1, marginRight: spacing.sm }}
            />
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              size="md"
              style={{ flex: 1 }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  title: {},
  categoryNameText: {},
  actions: {
    flexDirection: 'row',
  },
});
