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
          <Button
            label="Assign"
            icon="pi pi-tag"
            size="small"
            variant="text"
            v-on:click="showAssignCategoryForRow(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { useCategories, useUpdateCategoryOnExpenses } from '@/hooks/useCategories';
import { useDeleteExpenses } from '@/hooks/useExpenses';
import type { UiExpense } from '@/types/index';
import { useDialog } from 'primevue/usedialog';
import { ref } from 'vue';

import TheCategories from '@/components/TheCategories.vue';

export type ExpensesTableProps = {
  expenses: Array<Partial<UiExpense>>;
  selectedMonth: string;
  refetchFn: () => void;
  loading?: boolean;
};

const { expenses = [], refetchFn, selectedMonth } = defineProps<ExpensesTableProps>();

const selectedExpenses = ref<Array<UiExpense>>([]);
const { data: result } = useCategories();

const { mutateAsync: updateCategoryOnExpenses } = useUpdateCategoryOnExpenses();
const { mutateAsync: deleteExpensesMutate } = useDeleteExpenses();

const dialog = useDialog();

const showAssignCategory = () => {
  if (selectedExpenses.value.length === 0) return;

  dialog.open(TheCategories, {
    props: {
      header: 'Assign Category Rules',
      style: {
        width: '50vw',
      },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      modal: true,
    },
    data: {
      expense: selectedExpenses.value[0],
      expenseIds: selectedExpenses.value.map((e) => e.id),
    },
    emits: {
      onSuccessfulSave: async (data: any) => {
        const expenseIds = selectedExpenses.value.map((e) => e.id);
        console.log('🚀 ~ showAssignCategory ~ expenseIds:', expenseIds);
        if (expenseIds.length > 0) {
          await updateCategoryOnExpenses({ category: data.category, expenseIds });
        }
        await refetchFn();
        selectedExpenses.value = [];
      },
    },
  });
};

const showAssignCategoryForRow = (rowExpense: UiExpense) => {
  dialog.open(TheCategories, {
    props: {
      header: 'Assign Category Rules',
      style: {
        width: '50vw',
      },
      breakpoints: {
        '960px': '75vw',
        '640px': '90vw',
      },
      modal: true,
    },
    data: {
      expense: rowExpense,
    },
    emits: {
      onSuccessfulSave: async () => {
        await refetchFn();
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
</script>
