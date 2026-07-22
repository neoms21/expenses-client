import type { Category, CategoryWithoutId } from '@/types/index';
import { pb } from './dbClient';

export const fetchCategories = async (): Promise<{
  data: Array<Category>;
  error: any | null;
}> => {
  try {
    const records = await pb.collection('categories').getFullList<Category>({
      sort: 'category',
      fields: 'id,category,items',
    });
    return { data: records, error: null };
  } catch (error) {
    console.error('Error fetching categories:', error);
    return { data: [], error };
  }
};

export const insertCategory = async (category: CategoryWithoutId): Promise<boolean> => {
  try {
    const record = await pb.collection('categories').create<Category>(category);
    return !!record;
  } catch (error) {
    console.error('Error Saving Category:', error, category);
    return false;
  }
};

export const updateCategory = async (category: Category, newItems: string[]): Promise<boolean> => {
  const updatedItems = Array.from(new Set([...(category.items || []), ...newItems]));
  try {
    const record = await pb.collection('categories').update<Category>(category.id, {
      items: updatedItems,
    });
    return !!record;
  } catch (error) {
    console.error('Error updating Category:', error, category);
    return false;
  }
};
