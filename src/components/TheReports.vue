<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import { ref } from 'vue';
import { useCategoryExpenses } from '@/hooks/useCategoryExpenses';
import TheExpenses from './TheExpenses.vue';
const { inputs } = useReportInputs();

const expandedRows = ref({});

const { data: cexpenses } = useCategoryExpenses(inputs);
</script>
<template>
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <h2 class="text-center">Reports</h2>
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="cexpenses"
      dataKey="id"
      tableStyle="min-width: 60rem"
    >
      <Column expander style="width: 5rem" />
      <Column field="category" header="Category"></Column>

      <Column field="amount" header="Total" />
      <template #expansion="slotProps">
        <div class="p-4">
          <h1>Expenses for {{ slotProps.data.amount }}</h1>
          <TheExpenses :category="slotProps.data.category" />
        </div>
      </template>
    </DataTable>
  </div>
</template>
