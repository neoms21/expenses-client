<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import type { Category, ExpenseView } from '@/types';
import { ref } from 'vue';
import TheCategories from './TheCategories.vue';
import { useExpenses } from '@/hooks/useExpenses';
import { useCategories } from '@/hooks/useCategories';
const { inputs } = useReportInputs();

const expandedRows = ref({});
const { data: categories } = useCategories();
const newOrUpdatedCategory = ref<Category>();

const { data, refetch } = useExpenses(inputs, categories, newOrUpdatedCategory);

const visible = ref(false);

let selectedExpense: ExpenseView;

function showCategories(data: ExpenseView) {
  selectedExpense = data;
  visible.value = true;
}

const handleSuccessfulSave = async (val) => {
  newOrUpdatedCategory.value = val;
  await refetch();
  visible.value = false;
};
</script>
<template>
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <h2 class="text-center">Reports</h2>
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="data"
      dataKey="id"
      tableStyle="min-width: 60rem"
    >
      <Column expander style="width: 5rem" />
      <Column field="category" header="Category" />
      <Column field="total" header="Total" />
      <template #expansion="slotProps">
        <div class="p-4">
          <h5>Expenses for {{ slotProps.data.category }}</h5>
          <DataTable :value="slotProps.data.expenses">
            <Column field="description" header="Description" sortable></Column>
            <Column field="amount" header="Amount" sortable>
              <template #body="props">
                <span v-on:click="showCategories(props.data)">{{
                  props.data.amount
                }}</span></template
              >
            </Column>
            <Column field="date" header="Date" sortable></Column>
          </DataTable>
        </div>
      </template>
    </DataTable>
  </div>

  <Dialog
    v-model:visible="visible"
    header="Assign Category"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <TheCategories :expense="selectedExpense" @on-successful-save="handleSuccessfulSave" />
  </Dialog>
</template>
