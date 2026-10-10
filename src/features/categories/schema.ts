import { z } from 'zod';
import { NewCategory } from '@/db/types';

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Category name is required')
    .max(30, 'Category name cannot exceed 30 characters'),
  type: z.enum(['income', 'expense']),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please select a valid hex color'),
  icon: z.string().min(1, 'Please select an icon'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export function formValuesToNewCategory(
  values: CategoryFormValues,
): NewCategory {
  return {
    name: values.name.trim(),
    type: values.type,
    color: values.color,
    icon: values.icon,
    is_default: 0,
    archived: 0,
  };
}

