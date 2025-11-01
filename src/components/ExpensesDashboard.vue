<script setup lang="ts">
import { useDashboardData } from '@/hooks/useDashboardData';

const { data } = useDashboardData();
</script>

<template>
  <DataTable striped-rows :value="data?.data || []">
    <Column field="category" header="Category">
      <template #body="props">
        <RouterLink :to="{ name: 'details', query: { category: props.data.category } }">
          {{ props.data.category }}
        </RouterLink>
      </template>
    </Column>
    <Column field="amount" header="Amount" sortable> </Column>
  </DataTable>
</template>
