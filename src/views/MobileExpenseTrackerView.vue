<script setup lang="ts">
import { ref } from "vue";
import type { CategorySummary } from "@/types";
import MonthsView from "./v2/MonthsView.vue";
import TrackerCategoriesView from "./v2/TrackerCategoriesView.vue";
import ExpensesView from "./v2/ExpensesView.vue";

const selectedCategory = ref<CategorySummary>();

// const { data: dbCategories } = useCategories();

// Filtered and searched items
</script>

<template>
  <div class="flex flex-col gap-4 lg:grid lg:grid-cols-[360px_minmax(0,1fr)] lg:items-start lg:gap-6">
    <!-- Filters: stacked on mobile, sticky sidebar on desktop -->
    <aside class="flex flex-col gap-4 min-w-0 lg:sticky lg:top-4">
      <!-- 2. Account & Period Switcher Card -->
      <MonthsView />
      <TrackerCategoriesView v-model="selectedCategory" />
    </aside>

    <!-- Expenses -->
    <main class="flex flex-col gap-4 min-w-0">
      <ExpensesView :category="selectedCategory" />
    </main>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
