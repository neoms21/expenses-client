<template>
  <Message v-if="expenses.length === 0" severity="info">
    No expenses found for {{ selectedMonth }}
  </Message>

  <div class="" v-if="expenses.length || 0 > 0">
    <Message severity="info">Expenses for {{ selectedMonth }} </Message>
    <Button
      size="small"
      variant="text"
      :disabled="selectedExpenses?.length === 0"
      v-on:click="showAssignCategory"
      >Assign Category</Button
    >

    <Divider />
    <DataTable v-model:selection="selectedExpenses" striped-rows :value="expenses" dataKey="id">
      <Column
        :pt="{
          bodyCell: (data) => ({ 'data-testid': data.parent.props.rowData.id }),
        }"
        selectionMode="multiple"
        headerStyle="width: 1rem"
      ></Column>
      <Column field="description" header="Description" header-style="width: 50%" />
      <Column field="amount" header="Amount" />
      <Column field="date" header="Date" />
      <Column header="Assign Category">
        <template #body="slotProps">
          <Select
            optionLabel="category"
            editable
            :options="result?.data || []"
            v-on:change="
              (event) => {
                handleCategoryChange(slotProps.data.id, event);
              }
            "
            placeholder="Select a category"
            class="w-full md:w-56"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useCategories, useUpdateCategoryOnExpenses } from '@/hooks/useCategories';
import type { UiExpense } from '@/types';
import { useDialog } from 'primevue/usedialog';
import { ref } from 'vue';

import AssignCategory from '@/components/AssignCategory.vue';
import type { SelectChangeEvent } from 'primevue';

export type ExpensesTableProps = {
  expenses: Array<Partial<UiExpense>>;
  selectedMonth: string;
  refetchFn: () => void;
};

const { expenses = [], refetchFn, selectedMonth } = defineProps<ExpensesTableProps>();

const selectedExpenses = ref<Array<UiExpense>>([]);
const { data: result } = useCategories();

const { mutate: updateCategoryOnExpenses } = useUpdateCategoryOnExpenses();

const dialog = useDialog();

const showAssignCategory = () => {
  dialog.open(AssignCategory, {
    props: {
      header: 'Assign Category',
      style: {
        width: '50vw',
      },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      modal: true,
    },
    emits: {
      onCategoryAssignment: async (category: string) => {
        saveCategoryOnExpenses(
          selectedExpenses.value.map((e) => e.id),
          category,
        );
      },
    },
  });
};

const saveCategoryOnExpenses = async (expenseIds: Array<string>, category: string) => {
  await updateCategoryOnExpenses({ category, expenseIds });

  setTimeout(async () => {
    await refetchFn();
    // visible.value = false;
  }, 500);
};

const handleCategoryChange = async (expenseId: string, event: SelectChangeEvent) =>
  saveCategoryOnExpenses([expenseId], event.value.category);
</script>
