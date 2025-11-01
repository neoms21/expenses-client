import { fetchDashboardData, fetchExpensesByMonth } from '@/lib/expenses';
import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';

export const useDashboardData = () => {
  const { data, refetch } = useQuery({
    queryKey: [`expenses-dashboard`],
    structuralSharing: false,
    queryFn: () => fetchDashboardData(),
    staleTime: Infinity,
  });

  return { data, refetch };
};

export const useExpensesByMonth = (month: Ref<string>, category: Ref<string>) => {
  const { data, refetch, isLoading } = useQuery({
    queryKey: computed(() => [`expenses-by-month-${month.value}-${category.value}`]),
    structuralSharing: false,
    enabled: computed(() => !!month.value && !!category.value),
    queryFn: () => fetchExpensesByMonth(month.value, category.value),
    staleTime: Infinity,
  });

  return { data, refetch, isLoading };
};
