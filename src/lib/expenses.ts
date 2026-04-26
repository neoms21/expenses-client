import { supabase } from './dbClient';
import type { ExpensesInput } from '@/composables/useReportInputs';
const EXPENSES_COLS = 'month, description, amount, id, date, category, card_member';
export const fetchExpenses = async (params: ExpensesInput, category: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, amount, date, card_member, description, month, year, card')
    .in('year', params.years.map(Number))
    .in('month', params.months)
    .in('card', params.cards)
    .eq('category', category)
    .neq('category', 'Exclude')
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
    year_list: params.years,
  });

  if (error) {
    console.error('Error fetching expenses:', error);
  }

  return { data, error };
};

export const updateCategoryOnExpenses = async (category: string, expenseIds: string[]) => {
  const { data, error } = await supabase.from('expenses').update({ category }).in('id', expenseIds);
};

export const fetchDashboardData = async () => {
  return await supabase.from('get_dashboard').select('*');
};

export const fetchCategorisedExpensesByMonths = async (category: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('month, amount.sum()')
    .gt('amount', 0)
    .eq('category', category);

  return { data, error };
};

export const fetchExpensesByMonth = async (month: string, category: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSES_COLS)
    .gt('amount', 0)
    .eq('month', month)
    .eq('category', category)
    .order('amount', { ascending: false });

  return { data, error };
};

export const searchExpenses = async (query: string) => {
  const { data, error } = await supabase
    .from('expenses')
    .select(EXPENSES_COLS)
    .or(`differentiator.ilike.%${query}%,category.ilike.%${query}%`)
    .order('amount', { ascending: false });

  return { data, error };
};
