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

export const temp_update_expenses = async () => {
  // const { data, error } = await supabase
  //   .from('expenses')
  //   .select('id, category')
  //   .filter('tags', 'is', null);
  // // if (error
  // // .gte('amount', 0)
  // // .lte('amount', 0.48);
  // for (const expense of data!) {
  //   const { data, error } = await supabase
  //     .from('expenses')
  //     .update({ tags: [expense.category.toLowerCase()] })
  //     .eq('id', expense.id);
  // }
  // await
};

export const updateCategoryOnExpenses = async (category: string, expenseIds: string[]) => {
  const { data, error } = await supabase.from('expenses').update({ category }).in('id', expenseIds);
  console.log('🚀 ~ updateCategoryOnExpenses ~ data:', data);
};
// for (const expense of data!) {
//   const { data, error } = await supabase
//     .from('expenses')
//     .update({ tags: [expense.category.toLowerCase()] })
//     .eq('id', expense.id);
// }
// };
