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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createRecurringRule,
  deleteRecurringRule,
  getAllCategories,
  getAllRecurringRules,
  updateRecurringRule,
} from '@/db/queries';
import { Category, RecurringRuleWithCategory } from '@/db/types';
import { getTodayLocalDate } from '@/lib/dates';
import { formatCents } from '@/lib/money';
import { useAppTheme } from '@/theme';
import { useUIStore } from '@/lib/store';
import { Button, TextField } from '@/components';
import { CategoryPicker } from '@/features/transactions/components/CategoryPicker';
import { processRecurringRules } from '../engine';
import {
  formValuesToNewRecurringRule,
  recurringRuleFormSchema,
  RecurringRuleFormValues,
} from '../schema';

export function RecurringFormModal() {
  const { colors, spacing, radii, typography } = useAppTheme();
  const { currencySymbol } = useUIStore();
  const [rules, setRules] = useState<RecurringRuleWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecurringRuleFormValues>({
    resolver: zodResolver(recurringRuleFormSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      categoryId: 0,
      frequency: 'monthly',
      startDate: getTodayLocalDate(),
      note: '',
    },
  });

  const selectedType = watch('type');
  const selectedFreq = watch('frequency');

  const loadData = async () => {
    try {
      setLoading(true);
      const [allRules, cats] = await Promise.all([
        getAllRecurringRules(),
        getAllCategories(selectedType, false),
      ]);
      setRules(allRules);
      setCategories(cats);
      if (cats.length > 0 && watch('categoryId') === 0) {
        setValue('categoryId', cats[0].id);
      }
    } catch (err) {
      console.warn('Failed to load rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedType]);

  const onSubmit = async (values: RecurringRuleFormValues) => {
    try {
      const payload = formValuesToNewRecurringRule(values);
      await createRecurringRule(payload);
      const generated = await processRecurringRules();
      if (generated > 0) {
        useUIStore.getState().bumpTransactionsVersion();
      }
      reset();
      setShowForm(false);
      await loadData();
      Alert.alert('Success', 'Recurring rule created successfully.');
    } catch (err) {
      console.warn('Failed to save recurring rule:', err);
      Alert.alert('Save Failed', 'Could not save recurring rule.');
    }
  };

  const handleToggleActive = async (rule: RecurringRuleWithCategory) => {
    try {
      await updateRecurringRule(rule.id, { active: rule.active ? 0 : 1 });
      await loadData();
    } catch (err) {
      console.warn('Failed to toggle rule:', err);
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Delete Rule', 'Are you sure you want to delete this recurring rule?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRecurringRule(id);
          await loadData();
        },
      },
    ]);
  };

  const handleProcessNow = async () => {
    try {
      setLoading(true);
      const generated = await processRecurringRules();
      if (generated > 0) {
        useUIStore.getState().bumpTransactionsVersion();
        Alert.alert('Done', `Generated ${generated} new transactions.`);
      } else {
        Alert.alert('All Up to Date', 'No pending recurring transactions were due.');
      }
      await loadData();
    } catch {
      Alert.alert('Error', 'Failed to generate recurring transactions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        {/* Header Action Buttons */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
          <Button
            title={showForm ? 'View Rules' : '+ New Rule'}
            onPress={() => setShowForm(!showForm)}
            variant="primary"
            style={{ flex: 1 }}
          />
          <Button
            title="⚡ Run Rules"
            onPress={handleProcessNow}
            variant="secondary"
            loading={loading}
            style={{ flex: 1 }}
          />
        </View>

        {showForm ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.title,
                { color: colors.textPrimary, fontSize: typography.sizes.md, marginBottom: spacing.md },
              ]}
            >
              Add Recurring Rule
            </Text>

            {/* Type Toggle */}
            <View
              style={[
                styles.toggleRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.xxs,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {(['expense', 'income'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setValue('type', t)}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: selectedType === t ? colors.primary : 'transparent',
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedType === t ? colors.textInverse : colors.textSecondary,
                      fontWeight: typography.weights.bold,
                      textTransform: 'capitalize',
                    }}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Amount */}
            <Controller
              control={control}
              name="amount"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Amount"
                  placeholder="0.00"
                  prefix={currencySymbol}
                  keyboardType="decimal-pad"
                  value={value}
                  onChangeText={onChange}
                  error={errors.amount?.message}
                  containerStyle={{ marginBottom: spacing.md }}
                />
              )}
            />

            {/* Category */}
            <Controller
              control={control}
              name="categoryId"
              render={({ field: { onChange, value } }) => (
                <View style={{ marginBottom: spacing.md }}>
                  <CategoryPicker
                    categories={categories}
                    selectedCategoryId={value}
                    onSelectCategory={onChange}
                    error={errors.categoryId?.message}
                  />
                </View>
              )}
            />

            {/* Frequency */}
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.sm,
                marginBottom: spacing.xs,
              }}
            >
              Frequency
            </Text>
            <View
              style={[
                styles.toggleRow,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  borderRadius: radii.md,
                  padding: spacing.xxs,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((f) => (
                <Pressable
                  key={f}
                  onPress={() => setValue('frequency', f)}
                  style={[
                    styles.toggleBtn,
                    {
                      backgroundColor: selectedFreq === f ? colors.primary : 'transparent',
                      borderRadius: radii.sm,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: selectedFreq === f ? colors.textInverse : colors.textSecondary,
                      fontSize: typography.sizes.xs,
                      fontWeight: typography.weights.bold,
                      textTransform: 'capitalize',
                    }}
                  >
                    {f}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Start Date */}
            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Start Date (YYYY-MM-DD)"
                  placeholder="YYYY-MM-DD"
                  value={value}
                  onChangeText={onChange}
                  error={errors.startDate?.message}
                  containerStyle={{ marginBottom: spacing.md }}
                />
              )}
            />

            {/* Note */}
            <Controller
              control={control}
              name="note"
              render={({ field: { onChange, value } }) => (
                <TextField
                  label="Description / Note"
                  placeholder="e.g. Netflix, Gym, Salary"
                  value={value}
                  onChangeText={onChange}
                  containerStyle={{ marginBottom: spacing.lg }}
                />
              )}
            />

            <Button
              title="Save Rule"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              size="lg"
              loading={isSubmitting}
            />
          </View>
        ) : (
          <View>
            {rules.length === 0 ? (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radii.lg,
                    padding: spacing.xl,
                    alignItems: 'center',
                  },
                ]}
              >
                <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>
                  No recurring rules set yet. Add one to automatically generate regular bills or
                  salary!
                </Text>
              </View>
            ) : (
              rules.map((rule) => (
                <View
                  key={rule.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radii.lg,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.textPrimary, fontWeight: typography.weights.bold }}>
                        {rule.note || rule.category_name}
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: typography.sizes.xs, marginTop: 2 }}>
                        {rule.frequency.toUpperCase()} • Starts {rule.start_date}
                      </Text>
                    </View>
                    <Text
                      style={{
                        color: rule.type === 'income' ? colors.income : colors.expense,
                        fontWeight: typography.weights.bold,
                        fontSize: typography.sizes.md,
                      }}
                    >
                      {rule.type === 'income' ? '+' : '-'}
                      {formatCents(rule.amount_cents)}
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'flex-end',
                      gap: spacing.sm,
                      marginTop: spacing.sm,
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: colors.borderLight,
                      paddingTop: spacing.xs,
                    }}
                  >
                    <Button
                      title={rule.active ? 'Pause' : 'Activate'}
                      onPress={() => handleToggleActive(rule)}
                      variant="ghost"
                      size="sm"
                    />
                    <Button
                      title="Delete"
                      onPress={() => handleDelete(rule.id)}
                      variant="danger"
                      size="sm"
                    />
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
  },
  title: {
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
  },
  toggleBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
});
