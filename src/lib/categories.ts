import type { Category, CategoryWithoutId } from '@/types';
import { supabase } from './dbClient';
import type { PostgrestError } from '@supabase/supabase-js';

export const fetchCategories = async (): Promise<{
  data: Array<{ category: string | null }>;
  error: PostgrestError | null;
}> => {
  const { data, error } = await supabase.from('categories_from_expenses').select('*');
  console.log('🚀 ~ fetchCategories ~ data:', data);

  if (error) {
    console.error('Error fetching categories:', error);
  }

  return { data: data || [], error };
};

export const insertCategory = async (category: CategoryWithoutId): Promise<boolean> => {
  const { data, error } = await supabase.from('categories').insert(category);

  if (error) {
    console.error('Error Savig Category:', error, category);
  }

  return !!data;
};

export const updateCategory = async (category: Category, newItems: string[]): Promise<boolean> => {
  const uppdatedItems = [...category.items, ...newItems];
  const { data, error } = await supabase
    .from('categories')
    .update({ items: uppdatedItems })
    .eq('id', category.id);

  await Promise.all(
    newItems.map(async (newItem) => {
      const { data, error } = await supabase
        .from('expenses')
        .update({ category: category.category })
        .ilike('description', '%' + newItem + '%');

      console.log('🚀 ~ updateCategory ~ data:', data, error);
    }),
  );
  if (error) {
    console.error('Error updating Category:', error, category);
  }

  return !!data;
};
