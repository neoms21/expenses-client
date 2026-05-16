import { fetchDashboardData, fetchExpensesByMonth, fetchYears } from '@/lib/expenses';
import { useQuery } from '@tanstack/vue-query';
import { computed, type Ref } from 'vue';
import { extractFromTreeNodes } from './useCategoryExpenses';

export const useYears = () => {
  return useQuery({
    queryKey: ['available-years'],
    queryFn: () => fetchYears(),
    staleTime: Infinity,
  });
};

export const useDashboardData = (inputs: Ref<string[]>) => {
  const { data, refetch } = useQuery({
    queryKey: computed(() => [`expenses-dashboard-${inputs.value}`]),
    structuralSharing: false,
    queryFn: () => fetchDashboardData(extractFromTreeNodes(inputs.value)),
    select: (data) => {
      const rows = data.data || [];
      const pivoted = rows.reduce((acc: any, row: any) => {
        const category = row.category || 'Uncategorized';
        const year = row.year;
        if (!acc[category]) {
          acc[category] = { category };
        }
        acc[category][year] = row.amount;
        return acc;
      }, {});

      const years = Array.from(new Set(rows.map((r: any) => r.year))).sort(
        (a: any, b: any) => (b || 0) - (a || 0),
      );
      return {
        data: Object.values(pivoted),
        years,
      };
    },
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
