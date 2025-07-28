import { supabase } from './dbClient';
import type { ExpensesInput } from '@/composables/useReportInputs';

export const fetchExpenses = async (params: ExpensesInput) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, date, card_member, description, month, year, card')
    .in('year', params.years.map(Number))
    .in('month', params.months)
    .in('card', params.cards)
    .gte('amount', 0)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching expenses:', error);
  }

  return { data, error };
};
