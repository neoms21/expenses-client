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
    <DataTable
      v-model:expandedRows="expandedRows"
      :value="cexpenses"
      dataKey="id"
      tableStyle="min-width: 60rem"
    >
      <Column expander style="width: 5rem" />
      <Column field="category" header="Category">
        <!-- <template #body="{ data }">
          <span>{{ data.category }}</span>
        </template> -->
      </Column>

      <Column field="amount" header="Total" />
      <template #expansion="slotProps">
        <div class="p-4">
          <TheExpenses :category="slotProps.data.category" />
        </div>
      </template>
    </DataTable>
  </div>
</template>
