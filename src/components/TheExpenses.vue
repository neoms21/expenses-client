<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import { useExpensesByCategory } from '@/hooks/useExpenses';
import { toRef } from 'vue';
import ExpensesTable from '@/components/ExpensesTable.vue';

const props = defineProps(['category']);
const { inputs } = useReportInputs();

const { data, refetch } = useExpensesByCategory(inputs, toRef(props, 'category'));
</script>

<template>
  <ExpensesTable :expenses="data?.data || []" :selectedMonth="category" :refetchFn="refetch" />
</template>
