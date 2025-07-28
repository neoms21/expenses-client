import { ref, watch } from 'vue';
import type { Ref } from 'vue';
const REGEX_DATES = /\d{4}-\w{3}-\w{4}/g;

export type ExpensesInput = {
  years: string[];
  months: string[];
  cards: string[];
};

const inputs = ref<string[]>([]);
export function useReportInputs(treeNodes?: Ref<Record<string, string>>) {
  if (treeNodes)
    watch(treeNodes, (nv) => {
      inputs.value = Object.keys(nv).filter((k) => k.match(REGEX_DATES));
    });

  return {
    inputs,
  };
}
