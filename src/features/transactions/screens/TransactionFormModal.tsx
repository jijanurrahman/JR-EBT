import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTransaction,
  deleteTransaction,
  getAllCategories,
  getTransactionById,
  updateTransaction,
} from '@/db/queries';
import { Category } from '@/db/types';
import { getTodayLocalDate } from '@/lib/dates';
import { centsToDecimalString } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { Button, TextField } from '@/components';
import { CategoryPicker } from '../components/CategoryPicker';
import { useUIStore } from '@/lib/store';
import {
  formValuesToNewTransaction,
  transactionFormSchema,
  TransactionFormValues,
} from '../schema';

export function TransactionFormModal() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const params = useLocalSearchParams<{ id?: string; type?: 'income' | 'expense' }>();
  const isEditing = Boolean(params.id);
  const transactionId = params.id ? parseInt(params.id, 10) : undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(isEditing);

  const initialType = params.type === 'income' ? 'income' : 'expense';

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    mode: 'onChange',
    defaultValues: {
      type: initialType,
      amount: '',
      categoryId: 0,
      date: getTodayLocalDate(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const noteValue = watch('note') || '';

  // Load categories matching the active type
  useEffect(() => {
    let isMounted = true;
    getAllCategories(selectedType, false).then((cats) => {
      if (isMounted) {
        setCategories(cats);
        // Auto-select the first category if none is selected or if current category does not belong to this type
        const currentCatId = watch('categoryId');
        const isValidExisting = cats.some((c) => c.id === currentCatId);
        if (!isValidExisting && cats.length > 0) {
          setValue('categoryId', cats[0].id, { shouldValidate: true });
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedType, setValue, watch]);

  // Load existing transaction if in edit mode
  useEffect(() => {
    if (!transactionId) return;

    let isMounted = true;
    getTransactionById(transactionId).then((tx) => {
      if (isMounted && tx) {
        reset({
          type: tx.type,
          amount: centsToDecimalString(tx.amount_cents),
          categoryId: tx.category_id,
          date: tx.date,
          note: tx.note || '',
        });
        setLoadingInitial(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [transactionId, reset]);

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      const payload = formValuesToNewTransaction(values);
      if (isEditing && transactionId) {
        await updateTransaction(transactionId, payload);
      } else {
        await createTransaction(payload);
      }

      // Keep selected month aligned with the newly added transaction
      const txMonth = values.date.substring(0, 7);
      useUIStore.getState().setSelectedMonth(txMonth);
      useUIStore.getState().bumpTransactionsVersion();

      router.back();
    } catch (err) {
      console.warn('Failed to save transaction:', err);
      Alert.alert('Save Failed', 'An error occurred while saving the transaction.');
    }
  };

  const onInvalid = (formErrors: typeof errors) => {
    const errorMsg =
      formErrors.amount?.message ||
      formErrors.categoryId?.message ||
      formErrors.date?.message ||
      formErrors.note?.message ||
      'Please fill in all required fields correctly.';
    Alert.alert('Validation Error', errorMsg);
  };

  const handleDelete = () => {
    if (!transactionId) return;
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              useUIStore.getState().bumpTransactionsVersion();
              router.back();
            } catch (err) {
              console.warn('Failed to delete transaction:', err);
            }
          },
        },
      ],
    );
  };

  if (loadingInitial) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Text style={{ color: colors.textSecondary }}>Loading transaction...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Type Toggle */}
        <View
          style={[
            styles.typeToggle,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing.xxs,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Pressable
            onPress={() => setValue('type', 'expense', { shouldValidate: true })}
            style={[
              styles.typeButton,
              {
                borderRadius: radii.sm,
                backgroundColor:
                  selectedType === 'expense' ? colors.expense : 'transparent',
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color:
                    selectedType === 'expense'
                      ? colors.textInverse
                      : colors.textSecondary,
                  fontWeight: typography.weights.bold,
                  fontSize: typography.sizes.md,
                },
              ]}
            >
              Expense
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setValue('type', 'income', { shouldValidate: true })}
            style={[
              styles.typeButton,
              {
                borderRadius: radii.sm,
                backgroundColor:
                  selectedType === 'income' ? colors.income : 'transparent',
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color:
                    selectedType === 'income'
                      ? colors.textInverse
                      : colors.textSecondary,
                  fontWeight: typography.weights.bold,
                  fontSize: typography.sizes.md,
                },
              ]}
            >
              Income
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <Controller
          control={control}
          name="amount"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Amount"
              placeholder="0.00"
              prefix="$"
              keyboardType="decimal-pad"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.amount?.message}
              containerStyle={{ marginBottom: spacing.lg }}
            />
          )}
        />

        {/* Category Picker */}
        <Controller
          control={control}
          name="categoryId"
          render={({ field: { onChange, value } }) => (
            <View style={{ marginBottom: spacing.lg }}>
              <CategoryPicker
                categories={categories}
                selectedCategoryId={value}
                onSelectCategory={onChange}
                error={errors.categoryId?.message}
              />
            </View>
          )}
        />

        {/* Date Input */}
        <Controller
          control={control}
          name="date"
          render={({ field: { onChange, onBlur, value } }) => (
            <TextField
              label="Date (YYYY-MM-DD)"
              placeholder="YYYY-MM-DD"
              value={value}
              onBlur={onBlur}
              onChangeText={onChange}
              error={errors.date?.message}
              containerStyle={{ marginBottom: spacing.lg }}
            />
          )}
        />

        {/* Note Input */}
        <Controller
          control={control}
          name="note"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={{ marginBottom: spacing.lg }}>
              <TextField
                label="Note (Optional)"
                placeholder="What was this for?"
                value={value}
                onBlur={onBlur}
                onChangeText={onChange}
                multiline
                maxLength={140}
                numberOfLines={3}
                error={errors.note?.message}
              />
              <Text
                style={{
                  alignSelf: 'flex-end',
                  color: colors.textMuted,
                  fontSize: typography.sizes.xs,
                  marginTop: spacing.xxs,
                }}
              >
                {noteValue.length}/140
              </Text>
            </View>
          )}
        />

        {/* Action Buttons */}
        <Button
          title={isEditing ? 'Save Changes' : 'Add Transaction'}
          onPress={handleSubmit(onSubmit, onInvalid)}
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting}
          style={{ marginBottom: spacing.md }}
        />

        {isEditing ? (
          <Button
            title="Delete Transaction"
            onPress={handleDelete}
            variant="danger"
            size="md"
            style={{ marginBottom: spacing.md }}
          />
        ) : null}

        <Button
          title="Cancel"
          onPress={() => router.back()}
          variant="ghost"
          size="md"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  typeToggle: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {},
});
