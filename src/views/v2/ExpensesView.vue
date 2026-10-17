<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useDialog } from "primevue/usedialog";
import { useToast } from "primevue/usetoast";
import TheCategories from "@/components/TheCategories.vue";
import { useReportInputs } from "@/composables/useReportInputs";
import { useExpensesByCategory } from "@/hooks/useExpenses";
import type { CategorySummary } from "@/types";

const props = defineProps<{ category?: CategorySummary }>();

const dialog = useDialog();
const toast = useToast();

// Fetch expenses for the selected category and the tree inputs (years/months/cards)
const { inputs } = useReportInputs();
const categoryName = computed(() => props.category?.name ?? "");
const { data: expensesResult, refetch } = useExpensesByCategory(inputs, categoryName);
const expenses = computed(() => expensesResult.value?.data ?? []);
const selectedGroupField = ref<string>("none");

const searchQuery = ref("");
const groupOptions = [
  { label: "Group by: None", value: "none" },
  { label: "Group by: Date", value: "date" },
  { label: "Group by: Merchant", value: "description" },
  { label: "Group by: Amount", value: "amount" },
];
// Selection management
const selectedIds = ref<Set<string>>(new Set());

// Reset selection whenever the category or tree inputs change
watch([categoryName, inputs], () => {
  selectedIds.value = new Set();
});

const isSelected = (id: string) => selectedIds.value.has(id);

const toggleSelection = (id: string) => {
  const updated = new Set(selectedIds.value);
  if (updated.has(id)) {
    updated.delete(id);
  } else {
    updated.add(id);
  }
  selectedIds.value = updated;
};

const filteredExpenses = computed(() => {
  let list = expenses.value;

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.amount.toString().includes(q) ||
        (e.card_member && e.card_member.toLowerCase().includes(q)),
    );
  }

  return list;
});

// Actions: Assign Category & Delete
const selectedExpensesList = computed(() => {
  return expenses.value.filter((e) => selectedIds.value.has(e.id));
});

const handleAssignCategory = () => {
  if (selectedIds.value.size === 0) {
    toast.add({
      severity: "warn",
      summary: "No expenses selected",
      detail: "Please select at least one expense to assign a category.",
      life: 3000,
    });
    return;
  }

  const firstSelected = selectedExpensesList.value[0];
  dialog.open(TheCategories, {
    props: {
      showHeader: false,
      style: { width: "92vw", maxWidth: "640px" },
      modal: true,
    },
    data: {
      expense: firstSelected,
      expenseIds: Array.from(selectedIds.value),
    },
    onClose: (options) => {
      if (options?.data) {
        toast.add({
          severity: "success",
          summary: "Category Assigned",
          detail: "Expenses updated successfully",
          life: 3000,
        });
        selectedIds.value = new Set();
        refetch();
      }
    },
  });
};
</script>

<template>
  <template v-if="category">
    <div
      class="bg-blue-50/40 dark:bg-slate-800/60 border border-blue-200/90 dark:border-slate-700 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs"
    >
      <!-- Bulk Action Controls -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button
            @click="handleAssignCategory"
            :disabled="selectedIds.size === 0"
            class="px-3.5 py-1.5 rounded-xl border border-blue-600 text-blue-600 dark:text-blue-300 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            Assign Category
          </button>
          <button
            :disabled="true"
            class="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-600 dark:text-red-300 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-slate-800 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Search Bar & Group by Selector -->
    <div class="flex items-center gap-2.5">
      <!-- Search Field -->
      <div
        class="flex-1 flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl px-3 py-2 shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition"
      >
        <i class="pi pi-search text-xs text-slate-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search merchant, amount..."
          class="w-full text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 bg-transparent focus:outline-hidden"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="text-slate-400 hover:text-slate-600 text-xs"
        >
          <i class="pi pi-times" />
        </button>
      </div>

      <!-- Group by Dropdown -->
      <div class="shrink-0">
        <Select
          v-model="selectedGroupField"
          :options="groupOptions"
          optionLabel="label"
          optionValue="value"
          class="text-xs rounded-2xl border-slate-200/90 shadow-xs"
          pt:root:class="rounded-2xl"
        />
      </div>
    </div>

    <!-- 6. Expense Cards List -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-2.5 mt-1">
      <div
        v-if="filteredExpenses.length === 0"
        class="xl:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs"
      >
        No expenses found matching the criteria.
      </div>

      <div
        v-for="item in filteredExpenses"
        :key="item.id"
        @click="toggleSelection(item.id)"
        :class="[
          'bg-white dark:bg-slate-800 rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3',
          isSelected(item.id)
            ? 'border-blue-400 ring-1 ring-blue-100 dark:ring-blue-900'
            : 'border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600',
        ]"
      >
        <!-- Left: Checkbox + Merchant Information -->
        <div class="flex items-center gap-3 min-w-0">
          <input
            type="checkbox"
            :checked="isSelected(item.id)"
            @click.stop="toggleSelection(item.id)"
            class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
          />

          <div class="flex flex-col min-w-0">
            <span
              class="text-xs font-extrabold text-slate-900 dark:text-slate-100 tracking-wide uppercase truncate"
            >
              {{ item.description }}
            </span>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                v-if="item.card"
                class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded"
              >
                {{ item.card }}
              </span>
              <span v-if="item.card_member" class="text-[11px] text-slate-500">
                {{ item.card_member }} <span class="text-slate-300">•</span>
              </span>
              <span class="text-[11px] font-medium text-slate-500">
                {{ item.date }}
              </span>
            </div>
          </div>
        </div>

        <!-- Right: Amount & Category Status -->
        <div class="flex flex-col text-right shrink-0">
          <span class="text-sm font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            £{{ Number(item.amount).toFixed(2) }}
          </span>
          <span class="text-[11px] font-bold text-amber-600 mt-0.5">
            {{ item.category || "Unknown" }}
          </span>
        </div>
      </div>
    </div>
  </template>

  <!-- No category selected yet -->
  <div
    v-else
    class="flex flex-col items-center justify-center gap-2 py-16 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs text-center"
  >
    <i class="pi pi-list text-2xl" />
    <span>Select a category to view its expenses</span>
  </div>
</template>
