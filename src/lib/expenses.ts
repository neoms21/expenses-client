import { supabase } from './dbClient';
import type { ExpensesInput } from '@/composables/useReportInputs';

export const fetchExpenses = async (params: ExpensesInput, category: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, date, card_member, description, month, year, card')
    .in('year', params.years.map(Number))
    .in('month', params.months)
    .in('card', params.cards)
    .eq('category', category)
    .gte('amount', 0)
    .order('amount', { ascending: false });

  if (error) {
    console.error('Error fetching expenses:', error);
  }

  return { data, error };
};

export const fetchCategoryExpenses = async (params: ExpensesInput) => {
  const { data, error } = await supabase.rpc('category_expenses', {
    month_list: params.months,
    card_list: params.cards,
  });

  if (error) {
    console.error('Error fetching expenses:', error);
  }

  return { data, error };
};
