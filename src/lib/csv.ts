import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { getTransactions } from '@/db/queries';
import { formatCents } from './money';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function exportTransactionsCsv(month?: string): Promise<void> {
  const filters = month ? { month } : {};
  const transactions = await getTransactions(filters);

  if (transactions.length === 0) {
    throw new Error('No transactions to export.');
  }

  const header = 'Date,Type,Category,Amount,Note';
  const rows = transactions.map((tx) => {
    const date = escapeCsv(tx.date);
    const type = escapeCsv(tx.type);
    const category = escapeCsv(tx.category_name);
    const amount = formatCents(tx.amount_cents);
    const note = escapeCsv(tx.note || '');
    return `${date},${type},${category},${amount},${note}`;
  });

  const csvContent = [header, ...rows].join('\n');
  const fileName = month
    ? `JR-EBT_${month}_transactions.csv`
    : `JR-EBT_all_transactions.csv`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device.');
  }

  await Sharing.shareAsync(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: `Export ${month || 'All'} Transactions`,
    UTI: 'public.comma-separated-values-text',
  });
}

