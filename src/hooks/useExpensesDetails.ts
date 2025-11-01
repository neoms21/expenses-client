import { fetchDashboardData, fetchCategorisedExpensesByMonths } from '@/lib/expenses';
import { useQuery } from '@tanstack/vue-query';
import type { Ref } from 'vue';

const Months_In_Order = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const useExpensesDetails = (category: Ref<string>) => {
  const { data, refetch } = useQuery({
    queryKey: [`expenses-details-${category.value}`],
    structuralSharing: false,
    queryFn: () => fetchCategorisedExpensesByMonths(category.value),
    select: (data) => {
      //   const orderedData = Months_In_Order.map((month) =>
      //     (data.data || []).find((d) => d.month === month),
      //   ).filter(Boolean);

      const orderedData = data.data
        ?.filter((d) => Months_In_Order.includes(d.month))
        .sort((a, b) => {
          return Months_In_Order.indexOf(a.month) - Months_In_Order.indexOf(b.month);
        });
      return { data: orderedData || [] };
    },
    staleTime: Infinity,
  });

  return { data, refetch };
};
