<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import { useExpensesByCategory } from '@/hooks/useExpenses';
import type { Category, UiExpense } from '@/types';
import { ref, toRef } from 'vue';
import TheCategories2 from './TheCategories2.vue';
import { useUpdateCategoryOnExpenses } from '@/hooks/useCategories';

const props = defineProps(['category']);
const selectedExpenses = ref<Array<UiExpense>>([]);
const { inputs } = useReportInputs();

const { data, refetch } = useExpensesByCategory(inputs, toRef(props, 'category'));
const newOrUpdatedCategory = ref<Category>();

// const { data, refetch } = useExpenses(inputs, categories, newOrUpdatedCategory);

const visible = ref(false);

let selectedExpense: UiExpense;

function showCategories(data: UiExpense) {
  selectedExpense = data;
  visible.value = true;
}

const { mutate: updateCategoryOnExpenses } = useUpdateCategoryOnExpenses();

const onCategoryAssignment = async (category: string) => {
  await updateCategoryOnExpenses({
    category,
    expenseIds: selectedExpenses.value.map((expense) => expense.id),
  });

  setTimeout(async () => {
    await refetch();
    visible.value = false;
  }, 500);
};
</script>

<template>
  <div class="flex justify-content-center gap-5">
    <Button
      size="small"
      variant="text"
      :disabled="!selectedExpenses?.length"
      v-show="props.category === 'Unknown'"
      v-on:click="showCategories(selectedExpenses?.[0])"
      >Assign Category</Button
    >
  </div>
  <DataTable v-model:selection="selectedExpenses" :value="data?.data">
    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
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
    :header="`Assign Category to ${selectedExpenses?.length} expenses`"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <!-- <TheCategories :expense="selectedExpense" @on-successful-save="handleSuccessfulSave" /> -->
    <TheCategories2 :expenses="selectedExpenses" @on-category-assignment="onCategoryAssignment" />
  </Dialog>
</template>
