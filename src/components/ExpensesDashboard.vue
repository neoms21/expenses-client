<script setup lang="ts">
import { useDashboardData } from '@/hooks/useDashboardData';
import { useReportInputs } from '@/composables/useReportInputs';

const { inputs } = useReportInputs();
const { data } = useDashboardData(inputs);
</script>

<template>
  <DataTable striped-rows :value="data?.data || []" sortMode="single" sortField="category" :sortOrder="1">
    <Column field="category" header="Category" sortable>
      <template #body="props">
        <RouterLink :to="{ name: 'details', query: { category: props.data.category } }">
          {{ props.data.category }}
        </RouterLink>
      </template>
    </Column>
    <Column v-for="year in data?.years || []" :key="year" :field="year.toString()" :header="year.toString()" sortable>
      <template #body="props">
        {{ props.data[year] ? props.data[year].toFixed(2) : '-' }}
      </template>
    </Column>
  </DataTable>
</template>
