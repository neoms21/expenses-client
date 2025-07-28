// src/hooks/useArticles.js
import { fetchCategories, insertCategory, updateCategory } from '@/lib/categories';
import type { Category, CategoryWithoutId } from '@/types';
import { useQuery } from '@tanstack/vue-query';
import { useMutation } from '@tanstack/vue-query';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchCategories(),
    staleTime: Infinity,
    structuralSharing: false,
  });
}

export function useInsertCategory() {
  return useMutation({
    mutationFn: (category: CategoryWithoutId) => insertCategory(category),
  });
}

export function useUpdateCategory() {
  return useMutation({
    mutationFn: (obj: { id: number; items: string[] }) => updateCategory(obj.id, obj.items),
  });
}
