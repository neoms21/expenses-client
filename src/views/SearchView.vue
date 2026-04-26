<template>
  <div class="mt-4 flex flex-col gap-4">
    <div class="flex items-center gap-2">
      <InputText
        v-model="searchInput"
        placeholder="Search..."
        class="w-full md:w-80"
        @input="onInput"
      />
      <Button icon="pi pi-search" :loading="isFetching" @click="doSearch" />
    </div>

    <div v-if="searchQuery">
      <ExpensesTable
        :expenses="data || []"
        :selectedMonth="`Search: ${searchQuery}`"
        :refetchFn="refetch"
        :loading="isFetching"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSearchExpenses } from '@/hooks/useSearchExpenses';
import ExpensesTable from '@/components/ExpensesTable.vue';

const searchInput = ref('');
const searchQuery = ref('');

let timeout: ReturnType<typeof setTimeout>;

const onInput = () => {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    doSearch();
  }, 1000);
};

const doSearch = () => {
  searchQuery.value = searchInput.value;
};

const { data, refetch, isFetching } = useSearchExpenses(searchQuery);
</script>
