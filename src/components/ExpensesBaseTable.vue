<template>
  <DataTable
    :value="value"
    :selection="selection"
    @update:selection="$emit('update:selection', $event)"
    striped-rows
    dataKey="id"
    :paginator="paginator"
    :rows="rows"
    :rowsPerPageOptions="rowsPerPageOptions"
    :currentPageReportTemplate="currentPageReportTemplate"
    :paginatorTemplate="paginatorTemplate"
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
          v-on:click="$emit('assign-category', slotProps.data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup lang="ts">
import type { UiExpense } from '@/types/index';

defineProps<{
  value: Array<Partial<UiExpense>>;
  selection: Array<UiExpense>;
  paginator?: boolean;
  rows?: number;
  rowsPerPageOptions?: number[];
  currentPageReportTemplate?: string;
  paginatorTemplate?: string;
}>();

defineEmits<{
  (e: 'update:selection', value: Array<UiExpense>): void;
  (e: 'assign-category', row: UiExpense): void;
}>();
</script>
