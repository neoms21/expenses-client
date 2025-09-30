import type { ExpensesInput } from '@/composables/useReportInputs';
import { fetchCategoryExpenses, fetchExpenses } from '@/lib/expenses';
import { categoriseExpenses } from '@/transformers';
import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref, type ref } from 'vue';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types';
import ShortUniqueId from 'short-unique-id';

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

export const useCategoryExpenses = (selectedInputs: Ref<string[]>) => {
  const { data, refetch } = useQuery({
    queryKey: computed(() => {
      return [`category-expenses-${selectedInputs.value}`];
    }),
    structuralSharing: false,
    enabled: computed(() => selectedInputs.value?.length > 0),
    queryFn: () => fetchCategoryExpenses(extractFromTreeNodes(selectedInputs.value)),
    select: (data) => {
      return data.data?.map((d) => ({
        category: d.category,
        amount: d.total,
        id: new ShortUniqueId().rnd(),
      }));
    },
    staleTime: Infinity,
  });

  return { data, refetch };
};
