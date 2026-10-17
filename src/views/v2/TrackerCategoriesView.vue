<script setup lang="ts">
import { useReportInputs } from "@/composables/useReportInputs";
import { useCategoryExpenses } from "@/hooks/useCategoryExpenses";
import type { CategorySummary } from "@/types";
import { computed, ref } from "vue";
const { inputs } = useReportInputs();
const { data: categories } = useCategoryExpenses(inputs);

const selectedCategory = defineModel<CategorySummary>();
const search = ref("");

const filteredCategories = computed(() => {
  const q = search.value.trim().toLowerCase();
  const list = categories.value ?? [];
  return q ? list.filter((c) => c.name.toLowerCase().includes(q)) : list;
});
</script>

<template>
  <!-- 3. Categories Bar -->
  <div v-if="inputs?.length" class="flex flex-col gap-2">
    <div class="flex items-center justify-between px-0.5">
      <span class="text-xs font-bold text-slate-400 tracking-wider uppercase"> CATEGORIES </span>
      <button class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
        Manage ({{ categories?.length }})
      </button>
    </div>

    <!-- Category Search -->
    <div
      class="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3 py-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition"
    >
      <i class="pi pi-search text-xs text-slate-400" />
      <input
        v-model="search"
        type="text"
        id="category-search"
        placeholder="Search categories..."
        class="w-full text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-hidden"
      />
      <button
        v-if="search"
        @click="search = ''"
        class="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
      >
        <i class="pi pi-times" />
      </button>
    </div>

    <!-- Scrollable Category Pills -->
    <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 lg:flex-wrap lg:overflow-visible">
      <span v-if="!filteredCategories.length" class="text-xs text-slate-400 px-0.5">
        No categories found
      </span>
      <button
        v-for="cat in filteredCategories"
        :key="cat.name"
        @click="selectedCategory = cat"
        :class="[
          'px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer',
          selectedCategory?.name.toLowerCase() === cat.name.toLowerCase()
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-700',
        ]"
      >
        <div class="flex flex-col items-start leading-tight">
          <span>{{ cat.name }}</span>
          <span
            :class="[
              'text-[10px] font-medium',
              selectedCategory?.name.toLowerCase() === cat.name.toLowerCase()
                ? 'text-blue-100'
                : 'text-slate-500 dark:text-slate-400',
            ]"
          >
            £{{ Number(cat.amount).toFixed(2) }}
          </span>
        </div>
        <span
          v-if="cat.count"
          :class="[
            'px-2 py-0.5 rounded-full text-[11px] font-bold',
            selectedCategory?.name.toLowerCase() === cat.name.toLowerCase()
              ? 'bg-orange-600 text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200',
          ]"
        >
          {{ cat.count }}
        </span>
      </button>
    </div>

    <!-- <div v-if="selectedCategory" class="flex items-start justify-between">
      <div class="flex flex-col">
        <span
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold w-fit"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          Needs Review
        </span>
        <h2 class="text-lg font-bold text-slate-900 mt-2 leading-tight">
          Expenses for {{ selectedCategory.name }}
        </h2>
        <p class="text-xs text-slate-500 mt-0.5 font-medium">
          {{ selectedCategory.count }} uncategorized items pending
        </p>
      </div>

      <div class="flex flex-col text-right">
        <span class="text-xs font-semibold text-slate-500">Total pending</span>
        <span class="text-2xl font-black text-slate-900 tracking-tight">
          £{{ Number(selectedCategory.amount).toFixed(2) }}
        </span>
      </div>
    </div> -->
  </div>
</template>
