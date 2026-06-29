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
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
      <div class="flex items-center gap-2 pr-1">
        <span class="text-xs text-gray-500 font-medium select-none">Group by:</span>
        <Select
          v-model="selectedGroupField"
          :options="groupOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Select column"
          showClear
          class="w-40 text-xs"
          size="small"
          aria-label="Group by column"
        />
      </div>
    </div>

    <Divider />
    <Accordion v-if="selectedGroupField" multiple @update:value="onAccordionChange">
      <AccordionPanel v-for="group in groupedExpenses" :key="group.key" :value="group.key">
        <AccordionHeader>
          <div class="flex items-center gap-3 w-full justify-between pr-4">
            <span class="font-semibold text-sm text-blue-500 dark:text-orange-600">
              {{ groupOptions.find((o) => o.value === selectedGroupField)?.label }}: {{ group.key }}
            </span>
            <div class="flex items-center gap-3 text-xs">
              <span
                class="bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2.5 py-0.5 rounded-full font-medium"
              >
                {{ group.count }} items
              </span>
              <span class="text-red-500 dark:text-red-400 font-medium">
                Total: £{{ group.totalAmount.toFixed(2) }}
              </span>
              <Button
                v-if="group.items[0]"
                label="Assign"
                icon="pi pi-tag"
                size="small"
                variant="text"
                @click.stop="showAssignCategoryForRow(group.items[0] as UiExpense)"
              />
            </div>
          </div>
        </AccordionHeader>

        <AccordionContent>
          <!-- Lazy render: only mount DataTable once a panel has been opened -->
          <DataTable
            v-if="expandedPanels.has(group.key)"
            :selection="getSelectedExpensesForGroup(group.items)"
            @update:selection="updateSelectedExpensesForGroup(group.items, $event)"
            striped-rows
            :value="group.items"
            dataKey="id"
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
        </AccordionContent>
      </AccordionPanel>
    </Accordion>

    <DataTable
      v-else
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
import { ref, computed, watch } from 'vue';

import TheCategories from '@/components/TheCategories.vue';

export type ExpensesTableProps = {
  expenses: Array<Partial<UiExpense>>;
  selectedMonth: string;
  refetchFn: () => void;
  loading?: boolean;
};

const { expenses = [], refetchFn, selectedMonth } = defineProps<ExpensesTableProps>();

const selectedExpenses = ref<Array<UiExpense>>([]);

const selectedGroupField = ref<keyof UiExpense | null>(null);
const expandedPanels = ref<Set<string>>(new Set());

watch(selectedGroupField, () => {
  // When grouping field changes, clear the lazy-render cache
  expandedPanels.value = new Set();
});

// Tracks which panels have been opened so inner DataTables are only mounted on demand
const onAccordionChange = (openValues: string[]) => {
  // Add any newly opened panels to the set (never remove — lazy mount strategy)
  openValues.forEach((v) => expandedPanels.value.add(v));
};

const groupOptions = [
  { label: 'None', value: null },
  { label: 'Description', value: 'description' },
  { label: 'Amount', value: 'amount' },
  { label: 'Category', value: 'category' },
  { label: 'Date', value: 'date' },
];

const groupedExpenses = computed(() => {
  if (!selectedGroupField.value) return [];
  const field = selectedGroupField.value;
  const groupsMap: Record<string | number, Array<Partial<UiExpense>>> = {};

  expenses.forEach((e) => {
    const rawVal = e[field];
    const key = rawVal === undefined || rawVal === null ? 'Unassigned' : String(rawVal);
    if (!groupsMap[key]) {
      groupsMap[key] = [];
    }
    groupsMap[key].push(e);
  });

  const groupsList = Object.entries(groupsMap).map(([key, items]) => {
    const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    return {
      key,
      items,
      count: items.length,
      totalAmount,
    };
  });

  groupsList.sort((a, b) => {
    if (a.count !== b.count) {
      return b.count - a.count;
    }
    return a.key.localeCompare(b.key);
  });

  return groupsList;
});
const getSelectedExpensesForGroup = (groupItems: Array<Partial<UiExpense>>) => {
  const groupIds = new Set(groupItems.map((item) => item.id).filter(Boolean));
  return selectedExpenses.value.filter((e) => groupIds.has(e.id));
};

const updateSelectedExpensesForGroup = (
  groupItems: Array<Partial<UiExpense>>,
  newSelectionForGroup: Array<UiExpense>,
) => {
  const groupIds = new Set(groupItems.map((item) => item.id).filter(Boolean));
  const otherSelected = selectedExpenses.value.filter((e) => !groupIds.has(e.id));
  selectedExpenses.value = [...otherSelected, ...newSelectionForGroup];
};
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
      onSuccessfulSave: async () => {
        // const expenseIds = selectedExpenses.value.map((e) => e.id);
        // console.log('🚀 ~ showAssignCategory ~ expenseIds:', expenseIds);
        // if (expenseIds.length > 0) {
        //   await updateCategoryOnExpenses({ category: data.category, expenseIds });
        // }
        await refetchFn();
        // selectedExpenses.value = [];
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
