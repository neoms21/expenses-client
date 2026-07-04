import { fetchCategories, insertCategory, updateCategory } from '@/lib/categories';
import { updateCategoryOnExpenses } from '@/lib/expenses';
import type { Category, CategoryWithoutId } from '@/types/index';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: Infinity,
    structuralSharing: false,
  });
}

export function useInsertCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (category: CategoryWithoutId) => insertCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, newItems }: { category: Category; newItems: string[] }) =>
      updateCategory(category, newItems),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategoryOnExpenses() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ category, expenseIds }: { category: string; expenseIds: string[] }) =>
      updateCategoryOnExpenses(category, expenseIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === 'categories' ||
            (typeof key === 'string' &&
              (key.startsWith('expenses') || key.startsWith('category-expenses')))
          );
        },
      });
    },
  });
}
