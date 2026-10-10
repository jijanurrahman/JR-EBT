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
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import {
  archiveCategory,
  createCategory,
  getAllCategories,
  updateCategory,
} from '@/db/queries';
import { Category, TransactionType } from '@/db/types';
import { useAppTheme } from '@/theme';
import { Button, TextField } from '@/components';
import { AVAILABLE_CATEGORY_ICONS } from '../constants';
import {
  categoryFormSchema,
  CategoryFormValues,
} from '../schema';

export function CategoryFormModal() {
  const { colors, spacing, radii, typography, categoryColors } = useAppTheme();

  const [activeType, setActiveType] = useState<TransactionType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      type: 'expense',
      color: categoryColors[0],
      icon: 'restaurant-outline',
    },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');

  const loadCategories = React.useCallback(async () => {
    try {
      const data = await getAllCategories(activeType, true);
      setCategories(data);
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  }, [activeType]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    reset({
      name: '',
      type: activeType,
      color: categoryColors[0],
      icon: activeType === 'expense' ? 'restaurant-outline' : 'cash-outline',
    });
    setIsFormVisible(true);
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    reset({
      name: cat.name,
      type: cat.type,
      color: cat.color,
      icon: cat.icon,
    });
    setIsFormVisible(true);
  };

  const handleToggleArchive = async (cat: Category) => {
    try {
      const nextArchived = cat.archived === 1 ? false : true;
      await archiveCategory(cat.id, nextArchived);
      await loadCategories();
    } catch (err) {
      console.warn('Failed to update archive state:', err);
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: values.name.trim(),
          color: values.color,
          icon: values.icon,
        });
      } else {
        await createCategory({
          name: values.name.trim(),
          type: values.type,
          color: values.color,
          icon: values.icon,
          is_default: 0,
          archived: 0,
        });
      }
      setIsFormVisible(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
        setError('name', {
          message: 'A category with this name already exists for this type',
        });
      } else {
        Alert.alert('Error', 'Failed to save category.');
      }
    }
  };

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
            onPress={() => {
              setActiveType('expense');
              setIsFormVisible(false);
            }}
            style={[
              styles.typeButton,
              {
                borderRadius: radii.sm,
                backgroundColor:
                  activeType === 'expense' ? colors.expense : 'transparent',
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color:
                    activeType === 'expense'
                      ? colors.textInverse
                      : colors.textSecondary,
                  fontWeight: typography.weights.bold,
                  fontSize: typography.sizes.sm,
                },
              ]}
            >
              Expense Categories
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setActiveType('income');
              setIsFormVisible(false);
            }}
            style={[
              styles.typeButton,
              {
                borderRadius: radii.sm,
                backgroundColor:
                  activeType === 'income' ? colors.income : 'transparent',
                paddingVertical: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.typeText,
                {
                  color:
                    activeType === 'income'
                      ? colors.textInverse
                      : colors.textSecondary,
                  fontWeight: typography.weights.bold,
                  fontSize: typography.sizes.sm,
                },
              ]}
            >
              Income Categories
            </Text>
          </Pressable>
        </View>

        {/* Add/Edit Form when active */}
        {isFormVisible ? (
          <View
            style={[
              styles.formCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.lg,
                padding: spacing.lg,
                marginBottom: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.formTitle,
                {
                  color: colors.textPrimary,
                  fontSize: typography.sizes.md,
                  fontWeight: typography.weights.bold,
                  marginBottom: spacing.md,
                },
              ]}
            >
              {editingCategory ? 'Edit Category' : 'New Category'}
            </Text>

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Category Name"
                  placeholder="e.g. Groceries"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  error={errors.name?.message}
                  containerStyle={{ marginBottom: spacing.md }}
                />
              )}
            />

            {/* Color Swatches */}
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.textSecondary,
                  fontSize: typography.sizes.sm,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Color
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.md }}
            >
              {categoryColors.map((hex) => {
                const isSelected = selectedColor === hex;
                return (
                  <Pressable
                    key={hex}
                    onPress={() => setValue('color', hex, { shouldValidate: true })}
                    style={[
                      styles.colorSwatch,
                      {
                        backgroundColor: hex,
                        borderColor: isSelected ? colors.textPrimary : 'transparent',
                        borderWidth: isSelected ? 3 : 0,
                        borderRadius: radii.full,
                      },
                    ]}
                  />
                );
              })}
            </ScrollView>

            {/* Icon Grid */}
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: colors.textSecondary,
                  fontSize: typography.sizes.sm,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              Icon
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.lg }}
            >
              {AVAILABLE_CATEGORY_ICONS.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <Pressable
                    key={iconName}
                    onPress={() =>
                      setValue('icon', iconName, { shouldValidate: true })
                    }
                    style={[
                      styles.iconButton,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected
                          ? `${colors.primary}15`
                          : colors.surface,
                        borderRadius: radii.md,
                        padding: spacing.sm,
                      },
                    ]}
                  >
                    <Ionicons
                      name={iconName}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.formActions}>
              <Button
                title={editingCategory ? 'Update' : 'Create'}
                onPress={handleSubmit(onSubmit)}
                variant="primary"
                size="md"
                disabled={!isValid || isSubmitting}
                loading={isSubmitting}
                style={{ flex: 1, marginRight: spacing.sm }}
              />
              <Button
                title="Cancel"
                onPress={() => setIsFormVisible(false)}
                variant="secondary"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        ) : (
          <Button
            title="+ Add New Category"
            onPress={handleOpenAdd}
            variant="primary"
            style={{ marginBottom: spacing.lg }}
          />
        )}

        {/* Existing Categories List */}
        <Text
          style={[
            styles.listTitle,
            {
              color: colors.textSecondary,
              fontSize: typography.sizes.sm,
              fontWeight: typography.weights.bold,
              marginBottom: spacing.sm,
            },
          ]}
        >
          {activeType === 'expense' ? 'EXPENSE CATEGORIES' : 'INCOME CATEGORIES'}
        </Text>

        <View
          style={[
            styles.listContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radii.lg,
              overflow: 'hidden',
              borderWidth: 1,
            },
          ]}
        >
          {categories.map((cat, index) => {
            const isArchived = cat.archived === 1;
            return (
              <View
                key={cat.id}
                style={[
                  styles.categoryRow,
                  {
                    borderBottomColor: colors.borderLight,
                    borderBottomWidth: index === categories.length - 1 ? 0 : 1,
                    padding: spacing.md,
                    opacity: isArchived ? 0.6 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.catIcon,
                    { backgroundColor: cat.color, borderRadius: radii.md },
                  ]}
                >
                  <Ionicons
                    name={(cat.icon as keyof typeof Ionicons.glyphMap) || 'pricetag-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                </View>

                <View style={styles.catDetails}>
                  <Text
                    style={[
                      styles.catName,
                      {
                        color: colors.textPrimary,
                        fontSize: typography.sizes.md,
                        fontWeight: typography.weights.semibold,
                      },
                    ]}
                  >
                    {cat.name}
                  </Text>
                  {isArchived ? (
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: typography.sizes.xs,
                      }}
                    >
                      Archived (hidden in pickers)
                    </Text>
                  ) : null}
                </View>

                <View style={styles.catActions}>
                  <Pressable
                    onPress={() => handleOpenEdit(cat)}
                    hitSlop={8}
                    style={{ marginRight: spacing.md }}
                  >
                    <Ionicons
                      name="pencil-outline"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </Pressable>

                  <Pressable
                    onPress={() => handleToggleArchive(cat)}
                    hitSlop={8}
                  >
                    <Ionicons
                      name={isArchived ? 'refresh-outline' : 'archive-outline'}
                      size={18}
                      color={isArchived ? colors.primary : colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Button
          title="Done"
          onPress={() => router.back()}
          variant="secondary"
          style={{ marginTop: spacing.lg }}
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
  formCard: {
    borderWidth: 1,
  },
  formTitle: {},
  sectionLabel: {
    fontWeight: '500',
  },
  colorSwatch: {
    width: 34,
    height: 34,
  },
  iconButton: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formActions: {
    flexDirection: 'row',
  },
  listTitle: {
    letterSpacing: 0.5,
  },
  listContainer: {},
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  catDetails: {
    flex: 1,
  },
  catName: {},
  catActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
