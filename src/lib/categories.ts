import type { Category, CategoryWithoutId } from '@/types';
import { supabase } from './dbClient';
import type { PostgrestError } from '@supabase/supabase-js';

export const fetchCategories = async (): Promise<{
  data: Category[];
  error: PostgrestError | null;
}> => {
  const { data, error } = await supabase.from('categories').select('*');

  if (error) {
    console.error('Error fetching categories:', error);
  }

  return { data: data || [], error };
};

export const insertCategory = async (body: CategoryWithoutId): Promise<boolean> => {
  const { data, error } = await supabase.from('categories').insert(body);

  if (error) {
    console.error('Error Savig Category:', error, body);
  }

  return !!data;
};

export const updateCategory = async (id: number, items: string[]): Promise<boolean> => {
  const { data, error } = await supabase.from('categories').update({ items }).eq('id', id);

  if (error) {
    console.error('Error updating Category:', error, id, items);
  }

  return !!data;
};
