import { searchExpenses } from '@/lib/expenses';
import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import type { UiExpense } from '@/types';
import ShortUniqueId from 'short-unique-id';

export const useSearchExpenses = (query: Ref<string>) => {
  const { data, refetch, isFetching } = useQuery({
    queryKey: computed(() => {
      return ['search-expenses', query.value];
    }),
    structuralSharing: false,
    enabled: computed(() => query.value?.length > 2),
    queryFn: () => searchExpenses(query.value),
    select: (data) => {
      return data.data?.map(
        (d): Partial<UiExpense> => ({
          ...d,
          id: d.id || new ShortUniqueId().rnd(),
        }),
      );
    },
    staleTime: 60000,
  });

  return { data, refetch, isFetching };
};
