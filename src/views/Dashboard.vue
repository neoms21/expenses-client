<script setup lang="ts">
import ExpensesDashboard from '@/components/ExpensesDashboard.vue';
import { useYears } from '@/hooks/useDashboardData';
import { useReportInputs } from '@/composables/useReportInputs';
import { ref, watch } from 'vue';

const { data: years } = useYears();
const { inputs } = useReportInputs();

const selectedYear = ref();

watch(selectedYear, (newYear) => {
  if (newYear) {
    inputs.value = [newYear.toString()];
  } else {
    inputs.value = [];
  }
});
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center gap-4">
      <span>Select Year:</span>
      <Select
        v-model="selectedYear"
        :options="years || []"
        placeholder="All Years"
        class="w-48"
        showClear
      />
    </div>
    <ExpensesDashboard />
  </div>
</template>
