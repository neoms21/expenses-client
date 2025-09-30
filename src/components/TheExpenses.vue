<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import { useCategories } from '@/hooks/useCategories';
import { useExpensesByCategory } from '@/hooks/useExpenses';
import type { Category, ExpenseView } from '@/types';
import { ref, toRef } from 'vue';

const props = defineProps(['category']);

const { inputs } = useReportInputs();

const { data } = useExpensesByCategory(inputs, toRef(props, 'category'));
const { data: categories } = useCategories();
const newOrUpdatedCategory = ref<Category>();

// const { data, refetch } = useExpenses(inputs, categories, newOrUpdatedCategory);

const visible = ref(false);

let selectedExpense: ExpenseView;
function showCategories(data: ExpenseView) {
  selectedExpense = data;
  visible.value = true;
}

const handleSuccessfulSave = async (val) => {
  newOrUpdatedCategory.value = val;
  // await refetch();
  visible.value = false;
};
</script>

<template>
  <h4>{{ category }} - {{ data?.data?.length }}</h4>

  <DataTable :value="data?.data">
    <Column field="description" header="Description" sortable></Column>
    <Column field="amount" header="Amount" sortable>
      <template #body="props">
        <span v-on:click="showCategories(props.data)">{{ props.data.amount }}</span></template
      >
    </Column>
    <Column field="date" header="Date" sortable></Column>
  </DataTable>

  <Dialog
    v-model:visible="visible"
    header="Assign Category"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <TheCategories :expense="selectedExpense" @on-successful-save="handleSuccessfulSave" />
  </Dialog>
</template>
