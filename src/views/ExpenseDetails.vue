<script setup lang="ts">
import { useExpensesByMonth } from '@/hooks/useDashboardData';
import { useExpensesDetails } from '@/hooks/useExpensesDetails';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import Chart from 'primevue/chart';
import ExpensesTable from '@/components/ExpensesTable.vue';
const route = useRoute();

const selectedMonth = ref('');

const category = computed(() => route.query.category?.toString() || '');

const { data: details } = useExpensesDetails(category);
const { data: monthlyExpenses, refetch } = useExpensesByMonth(selectedMonth, category);

const chartOptions = ref();

const setChartData = (labels: Array<string>, data: Array<number>) => {
  return {
    labels,
    datasets: [
      {
        label: 'Expenses',
        data,
        backgroundColor: [
          'rgba(249, 115, 22, 0.2)',
          'rgba(6, 182, 212, 0.2)',
          'rgb(107, 114, 128, 0.2)',
          'rgba(139, 92, 246 0.2)',
        ],
        borderColor: [
          'rgb(249, 115, 22)',
          'rgb(6, 182, 212)',
          'rgb(107, 114, 128)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 1,
      },
    ],
  };
};

const setMonth = (month: string) => {
  if (month) selectedMonth.value = month;
};

onMounted(() => {
  chartOptions.value = setChartOptions();
});

const setChartOptions = () => {
  const documentStyle = getComputedStyle(document.documentElement);
  const textColor = documentStyle.getPropertyValue('--p-text-color');
  const textColorSecondary = documentStyle.getPropertyValue('--p-text-muted-color');
  const surfaceBorder = documentStyle.getPropertyValue('--p-content-border-color');

  return {
    onClick: function (_evt, item: any) {
      setMonth(details.value?.data?.[item?.[0]?.index]?.month || '');
    },
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
      datalabels: {
        anchor: 'end',
        align: 'end',
        formatter: (val: number) => '£' + val,
      },
    },
    scales: {
      x: {
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          color: textColorSecondary,
        },
        grid: {
          color: surfaceBorder,
        },
      },
    },
  };
};
</script>

<template>
  <div class="mt-2">Selected Category:</div>
  <Message class="mt-1" severity="warn" variant="simple">{{ category }}</Message>
  <div class="mt-6 grid grid-cols-2 gap-2">
    <Chart
      type="bar"
      :plugins="[ChartDataLabels]"
      :data="
        setChartData(
          details?.data?.map((d) => d?.month) || [],
          details?.data?.map((d) => d?.sum) || [],
        )
      "
      :options="chartOptions"
    />

    <ExpensesTable
      :expenses="monthlyExpenses?.data || []"
      :selected-month="selectedMonth"
      :refetch-fn="refetch"
    />
  </div>
</template>
