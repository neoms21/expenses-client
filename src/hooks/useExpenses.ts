import type { ExpensesInput } from '@/composables/useReportInputs';
import { fetchExpenses } from '@/lib/expenses';
import { categoriseExpenses } from '@/transformers';
import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref, type ref } from 'vue';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types';

const extractFromTreeNodes = (nodes: string[]): ExpensesInput => {
  const x = nodes.reduce(
    (acc, n) => {
      const [year, month, card] = n.split('-');

      acc.years.add(year);
      acc.months.add(month);
      acc.cards.add(card);
      return acc;
    },
    { years: new Set<string>(), months: new Set<string>(), cards: new Set<string>() },
  );

  return { years: Array.from(x.years), months: Array.from(x.months), cards: Array.from(x.cards) };
};

export const useExpenses = (
  selectedInputs: Ref<string[]>,
  categories: Ref,
  upsertedCategory: Ref<Category | undefined>,
) => {
  const { data, refetch } = useQuery({
    queryKey: computed(() => {
      return [`expenses-${selectedInputs.value}`];
    }),
    structuralSharing: false,
    enabled: computed(() => selectedInputs.value?.length > 0),
    queryFn: () => fetchExpenses(extractFromTreeNodes(selectedInputs.value), ''),
    select: (data) => {
      const allCategories = [...categories.value?.data];

      if (upsertedCategory?.value) {
        allCategories.push(upsertedCategory.value);
      }

      return categoriseExpenses(data.data || [], allCategories);
    },
    staleTime: Infinity,
  });

  return { data, refetch };
};

export const useExpensesByCategory = (selectedInputs: Ref<string[]>, category: Ref<string>) => {
  console.log('🚀 ~ useExpensesByCategory ~ category:', category);
  const { data, refetch } = useQuery({
    queryKey: computed(() => {
      return [`expenses-${selectedInputs.value}-${category.value}`];
    }),
    structuralSharing: false,
    enabled: computed(() => selectedInputs.value?.length > 0 && !!category.value),
    queryFn: () => fetchExpenses(extractFromTreeNodes(selectedInputs.value), category.value),
    // select: (data) => {},
    staleTime: Infinity,
  });

  return { data, refetch };
};
