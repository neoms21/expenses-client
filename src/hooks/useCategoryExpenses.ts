import type { ExpensesInput } from "@/composables/useReportInputs";
import { fetchCategoryExpenses } from "@/lib/expenses";
import { useQuery } from "@tanstack/vue-query";
import { computed, type Ref } from "vue";
import ShortUniqueId from "short-unique-id";
import type { CategorySummary } from "../types";

export const extractFromTreeNodes = (nodes: string[]): ExpensesInput => {
  const x = nodes.reduce(
    (acc, n) => {
      const [year, month, card] = n.split("-");

      acc.years.add(year || "");
      acc.months.add(month || "");
      acc.cards.add(card || "");
      return acc;
    },
    { years: new Set<string>(), months: new Set<string>(), cards: new Set<string>() },
  );

  return { years: Array.from(x.years), months: Array.from(x.months), cards: Array.from(x.cards) };
};

export const useCategoryExpenses = (
  selectedInputs: Ref<string[]>,
): { data: Ref<CategorySummary[] | undefined>; refetch: () => void } => {
  const { data, refetch } = useQuery({
    queryKey: computed(() => {
      return [`category-expenses-${selectedInputs.value}`];
    }),
    structuralSharing: false,
    enabled: computed(() => selectedInputs.value?.length > 0),
    queryFn: () => fetchCategoryExpenses(extractFromTreeNodes(selectedInputs.value)),
    select: (data) => {
      const isUnknown = (name: string) => name?.toLowerCase() === "unknown";
      return (
        data.data
          ?.map((d) => ({
            name: d.category,
            amount: d.total,
            count: d.count,
            id: new ShortUniqueId().rnd(),
          }))
          .sort((a, b) => {
            if (isUnknown(a.name) !== isUnknown(b.name)) return isUnknown(a.name) ? -1 : 1;
            return Number(b.amount) - Number(a.amount);
          }) || []
      );
    },
    staleTime: Infinity,
  });

  return { data, refetch };
};
