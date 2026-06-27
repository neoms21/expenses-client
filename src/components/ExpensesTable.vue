<template>
  <div
    v-if="loading && expenses.length === 0"
    class="text-center p-4 bg-blue-100 text-blue-800 rounded-md"
  >
    Loading expenses...
  </div>
  <div v-else-if="expenses.length === 0" class="text-center p-4 bg-red-100 text-red-800 rounded-md">
    No expenses found for {{ selectedMonth }}
  </div>

  <div class="" v-else-if="expenses.length || 0 > 0">
    <Message severity="info">
      Expenses for {{ selectedMonth }} ({{ expenses.length }} - total
      {{ expenses.reduce((acc, e) => acc + (e.amount || 0), 0).toFixed(2) }})
    </Message>
    <div class="flex gap-2">
      <Button
        size="small"
        variant="text"
        :disabled="selectedExpenses?.length === 0"
        v-on:click="showAssignCategory"
        >Assign Category</Button
      >
      <Button
        size="small"
        variant="text"
        severity="danger"
        :disabled="selectedExpenses?.length === 0"
        v-on:click="handleDeleteSelected"
        >Delete</Button
      >
    </div>

    <Divider />
    <DataTable
      v-model:selection="selectedExpenses"
      striped-rows
      :value="expenses"
      dataKey="id"
      paginator
      :rows="10"
      :rowsPerPageOptions="[5, 10, 20, 50]"
      currentPageReportTemplate="Showing {first} to {last} of {totalRecords} expenses"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
    >
      <Column
        :pt="{
          bodyCell: (data) => ({ 'data-testid': data.parent.props.rowData.id }),
        }"
        selectionMode="multiple"
        headerStyle="width: 1rem"
      ></Column>
      <Column field="description" header="Description" header-style="width: 30%">
        <template #body="{ data }">
          <span class="text-xs">{{ data.description }}</span>
        </template>
      </Column>
      <Column field="amount" header="Amount" />
      <Column field="category" header="Category" />
      <Column field="date" header="Date" />
      <Column header="Assign Category">
        <template #body="slotProps">
          <Select
            optionLabel="category"
            size="small"
            :options="result?.data || []"
            v-on:change="
              async (event) => {
                await handleCategoryChange(slotProps.data.id, event);
                await refetchFn();
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
import { useDeleteExpenses } from '@/hooks/useExpenses';
import type { UiExpense } from '@/types';
import { useDialog } from 'primevue/usedialog';
import { ref } from 'vue';

import AssignCategory from '@/components/AssignCategory.vue';
import type { SelectChangeEvent } from 'primevue';

export type ExpensesTableProps = {
  expenses: Array<Partial<UiExpense>>;
  selectedMonth: string;
  refetchFn: () => void;
  loading?: boolean;
};

const { expenses = [], refetchFn, selectedMonth } = defineProps<ExpensesTableProps>();

const selectedExpenses = ref<Array<UiExpense>>([]);
const { data: result } = useCategories();

const { mutate: updateCategoryOnExpenses } = useUpdateCategoryOnExpenses();
const { mutateAsync: deleteExpensesMutate } = useDeleteExpenses();

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

const handleDeleteSelected = async () => {
  if (selectedExpenses.value.length === 0) return;
  const confirmed = confirm(
    `Are you sure you want to delete the selected ${selectedExpenses.value.length} expense(s)?`,
  );
  if (!confirmed) return;

  try {
    await deleteExpensesMutate(selectedExpenses.value.map((e) => e.id));
    selectedExpenses.value = [];
    await refetchFn();
  } catch (err) {
    console.error('Error deleting expenses:', err);
  }
};

const saveCategoryOnExpenses = async (expenseIds: Array<string>, category: string) => {
  await updateCategoryOnExpenses({ category, expenseIds });

  setTimeout(async () => {
    await refetchFn();
    // visible.value = false;
  }, 500);
};

const handleCategoryChange = async (expenseId: string, event: SelectChangeEvent) => {
  return saveCategoryOnExpenses([expenseId], event.value.category);
};
</script>
