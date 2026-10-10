import { getTodayLocalDate } from '@/lib/dates';
import { getDueDatesForRule } from '@/lib/recurrence';
import {
  getAllRecurringRules,
  createTransaction,
  updateRecurringRule,
} from '@/db/queries';

export async function processRecurringRules(): Promise<number> {
  const rules = await getAllRecurringRules(true);
  const today = getTodayLocalDate();
  let generatedCount = 0;

  for (const rule of rules) {
    const dueDates = getDueDatesForRule(
      rule.start_date,
      rule.last_generated_date,
      rule.end_date,
      today,
      rule.frequency,
      rule.interval,
    );

    if (dueDates.length === 0) continue;

    for (const date of dueDates) {
      await createTransaction({
        type: rule.type,
        amount_cents: rule.amount_cents,
        category_id: rule.category_id,
        note: rule.note ? `[Recurring] ${rule.note}` : '[Recurring]',
        date,
        recurring_id: rule.id,
      });
      generatedCount++;
    }

    const latestGenerated = dueDates[dueDates.length - 1];
    await updateRecurringRule(rule.id, {
      last_generated_date: latestGenerated,
    });
  }

  return generatedCount;
}

