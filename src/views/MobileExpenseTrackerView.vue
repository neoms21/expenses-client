<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useDialog } from "primevue/usedialog";
import { useToast } from "primevue/usetoast";
import TheCategories from "@/components/TheCategories.vue";
import { useDeleteExpenses } from "@/hooks/useExpenses";
import { useCategories } from "@/hooks/useCategories";
import { fetchExpenses, fetchCategoryExpenses } from "@/lib/expenses";
import type { UiExpense } from "@/types/index";
import { getTimelines } from "@/services";
import MonthsView from "./v2/MonthsView.vue";

const router = useRouter();
const authStore = useAuthStore();
const dialog = useDialog();
const toast = useToast();
const { mutateAsync: deleteExpensesMutate } = useDeleteExpenses();
const { data: dbCategories } = useCategories();

// const res = await getTimelines();
// console.log("🚀 ~ res:", JSON.stringify(res))

// User info
const userDisplayName = computed(() => authStore.userDisplayName || "Manoj Sethi");
const userInitials = computed(() => {
  const name = userDisplayName.value;
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
});

// Period & Account info
const selectedAccount = ref({
  code: "H",
  name: "HSBC Account",
  period: "Sep 2026",
  total: "£747.67",
});

// Available categories with fallback to screenshot data
const categories = ref([
  { name: "Unknown", count: 17, total: 146.2 },
  { name: "Leisure", count: 8, total: 210.5 },
  { name: "Office", count: 5, total: 85.0 },
  { name: "Online", count: 12, total: 195.4 },
  { name: "Parking", count: 4, total: 42.0 },
  { name: "Travel", count: 6, total: 68.57 },
]);

const selectedCategory = ref("Unknown");

// Mock items matching screenshot as default fallback
const mockExpenses: Array<UiExpense & { location?: string; cardBadge?: string }> = [
  {
    id: "exp-1",
    description: "SPORTS DIRECT SHIREBROOK",
    amount: 49.99,
    date: "Sep 28",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-2",
    description: "SumUp *SAMIH LIMITED",
    amount: 16.0,
    date: "Sep 26",
    location: "Sunbury On Thames",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-3",
    description: "AMAZON EU SARL",
    amount: 11.15,
    date: "Sep 25",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-4",
    description: "TFL TRAVEL CHARGE",
    amount: 3.4,
    date: "Sep 24",
    location: "London",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-5",
    description: "SAINSBURYS S/MKTS",
    amount: 22.8,
    date: "Sep 23",
    location: "Staines",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-6",
    description: "COSTA COFFEE",
    amount: 4.85,
    date: "Sep 22",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
  {
    id: "exp-7",
    description: "BOOTS OPTICIANS",
    amount: 38.01,
    date: "Sep 20",
    card_member: "Manoj Sethi",
    category: "Unknown",
    month: "Sep 2026",
    year: 2026,
    cardBadge: "HSBC Card",
  },
];

const expenses = ref<Array<UiExpense & { location?: string; cardBadge?: string }>>([
  ...mockExpenses,
]);
const isLoading = ref(false);

// Load real data if available from PocketBase
const loadData = async () => {
  try {
    isLoading.value = true;
    const catSummary = await fetchCategoryExpenses({
      years: ["2026"],
      months: ["Sep", "September"],
      cards: [],
    });

    if (catSummary.data && catSummary.data.length > 0) {
      categories.value = catSummary.data.map((c) => ({
        name: c.category,
        count: c.count || 0,
        total: c.total || 0,
      }));
    }

    const res = await fetchExpenses(
      {
        years: ["2026"],
        months: ["Sep", "September"],
        cards: [],
      },
      selectedCategory.value,
    );

    if (res.data && res.data.length > 0) {
      expenses.value = res.data.map((e) => ({
        ...e,
        cardBadge: e.card || "HSBC Card",
        location: e.card_member || undefined,
      }));
    }
  } catch (err) {
    console.warn("Using mockup design fallback data:", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

// Selection management
const selectedIds = ref<Set<string>>(new Set(["exp-1", "exp-2"])); // Default checked like screenshot

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

// Filtered and searched items
const searchQuery = ref("");
const selectedGroupField = ref<string>("none");

const groupOptions = [
  { label: "Group by: None", value: "none" },
  { label: "Group by: Date", value: "date" },
  { label: "Group by: Merchant", value: "description" },
  { label: "Group by: Amount", value: "amount" },
];

const filteredExpenses = computed(() => {
  let list = expenses.value;

  if (selectedCategory.value) {
    list = list.filter(
      (e) => (e.category || "Unknown").toLowerCase() === selectedCategory.value.toLowerCase(),
    );
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    list = list.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.amount.toString().includes(q) ||
        (e.location && e.location.toLowerCase().includes(q)),
    );
  }

  return list;
});

// Select All handling
const isAllSelected = computed(() => {
  if (filteredExpenses.value.length === 0) return false;
  return filteredExpenses.value.every((e) => selectedIds.value.has(e.id));
});

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    const next = new Set(selectedIds.value);
    filteredExpenses.value.forEach((e) => next.delete(e.id));
    selectedIds.value = next;
  } else {
    const next = new Set(selectedIds.value);
    filteredExpenses.value.forEach((e) => next.add(e.id));
    selectedIds.value = next;
  }
};

// Summary metrics
const currentCategoryInfo = computed(() => {
  const found = categories.value.find(
    (c) => c.name.toLowerCase() === selectedCategory.value.toLowerCase(),
  );
  const count = filteredExpenses.value.length;
  const total = filteredExpenses.value.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  return {
    name: selectedCategory.value,
    count: found?.count || count,
    total: found?.total || total,
  };
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
        loadData();
        selectedIds.value.clear();
      }
    },
  });
};

const handleDelete = async () => {
  if (selectedIds.value.size === 0) return;
  const count = selectedIds.value.size;
  if (confirm(`Are you sure you want to delete ${count} selected expense(s)?`)) {
    try {
      const idsToDelete = Array.from(selectedIds.value);
      await deleteExpensesMutate(idsToDelete);
      expenses.value = expenses.value.filter((e) => !selectedIds.value.has(e.id));
      selectedIds.value.clear();
      toast.add({
        severity: "info",
        summary: "Deleted",
        detail: `Removed ${count} expense(s)`,
        life: 3000,
      });
    } catch (err) {
      // In case of mock data delete
      expenses.value = expenses.value.filter((e) => !selectedIds.value.has(e.id));
      selectedIds.value.clear();
    }
  }
};

const handleSignOut = () => {
  authStore.logout();
  router.push({ name: "login" });
};
</script>

<template>
  <div class="min-h-screen bg-slate-50/60 pb-16 font-sans antialiased text-slate-800">
    <div class="max-w-md mx-auto px-4 pt-4 flex flex-col gap-4">
      <!-- 1. Header: Branding & User Profile -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Logo Icon -->
          <div
            class="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-base tracking-tight shadow-sm shadow-blue-200"
          >
            QT
          </div>
          <!-- Title & Subtitle -->
          <div class="flex flex-col">
            <span class="text-[11px] font-bold text-blue-600 tracking-wider uppercase">
              QUBITTECH
            </span>
            <span class="text-base font-bold text-slate-900 leading-tight"> Expense Manager </span>
          </div>
        </div>

        <!-- User Profile Pill & Sign Out -->
        <div class="flex items-center gap-2">
          <div
            class="flex items-center gap-2 bg-slate-100/90 pl-1.5 pr-3 py-1 rounded-full border border-slate-200/50 shadow-xs"
          >
            <div
              class="w-7 h-7 rounded-full bg-slate-800 text-white font-semibold text-xs flex items-center justify-center"
            >
              {{ userInitials }}
            </div>
            <span class="text-xs font-semibold text-slate-700 max-w-28 truncate">
              {{ userDisplayName }}
            </span>
          </div>
          <button
            @click="handleSignOut"
            class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            title="Sign out"
            aria-label="Sign out"
          >
            <i class="pi pi-sign-out text-sm" />
          </button>
        </div>
      </header>

      <!-- 2. Account & Period Switcher Card -->
      <MonthsView />

      <!-- 3. Categories Bar -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between px-0.5">
          <span class="text-xs font-bold text-slate-400 tracking-wider uppercase">
            CATEGORIES
          </span>
          <button
            class="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
            @click="router.push('/reports')"
          >
            Manage ({{ categories.length }})
          </button>
        </div>

        <!-- Scrollable Category Pills -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            v-for="cat in categories"
            :key="cat.name"
            @click="selectedCategory = cat.name"
            :class="[
              'px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer',
              selectedCategory.toLowerCase() === cat.name.toLowerCase()
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-100/70',
            ]"
          >
            <span>{{ cat.name }}</span>
            <span
              v-if="cat.count"
              :class="[
                'px-2 py-0.5 rounded-full text-[11px] font-bold',
                selectedCategory.toLowerCase() === cat.name.toLowerCase()
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-600',
              ]"
            >
              {{ cat.count }}
            </span>
          </button>
        </div>
      </div>

      <!-- 4. Review Summary Card -->
      <div
        class="bg-blue-50/40 border border-blue-200/90 rounded-3xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs"
      >
        <div class="flex items-start justify-between">
          <div class="flex flex-col">
            <!-- Badge -->
            <span
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold w-fit"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Needs Review
            </span>
            <!-- Title -->
            <h2 class="text-lg font-bold text-slate-900 mt-2 leading-tight">
              Expenses for {{ currentCategoryInfo.name }}
            </h2>
            <p class="text-xs text-slate-500 mt-0.5 font-medium">
              {{ currentCategoryInfo.count }} uncategorized items pending
            </p>
          </div>

          <!-- Total Pending Metric -->
          <div class="flex flex-col text-right">
            <span class="text-xs font-semibold text-slate-500">Total pending</span>
            <span class="text-2xl font-black text-slate-900 tracking-tight">
              £{{ Number(currentCategoryInfo.total).toFixed(2) }}
            </span>
          </div>
        </div>

        <!-- Subtle Card Divider -->
        <hr class="border-blue-100" />

        <!-- Bulk Action Controls -->
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              :checked="isAllSelected"
              @change="toggleSelectAll"
              class="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer accent-blue-600"
            />
            <span class="text-xs font-semibold text-slate-700">
              Select all {{ filteredExpenses.length }}
            </span>
          </label>

          <div class="flex items-center gap-2">
            <button
              @click="handleAssignCategory"
              :disabled="selectedIds.size === 0"
              class="px-3.5 py-1.5 rounded-xl border border-blue-600 text-blue-600 bg-white hover:bg-blue-50 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
            >
              Assign Category
            </button>
            <button
              @click="handleDelete"
              :disabled="selectedIds.size === 0"
              class="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-600 bg-white hover:bg-red-50 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
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
          class="flex-1 flex items-center gap-2 bg-white border border-slate-200/90 rounded-2xl px-3 py-2 shadow-xs focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition"
        >
          <i class="pi pi-search text-xs text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search merchant, amount..."
            class="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-hidden"
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
      <div class="flex flex-col gap-2.5 mt-1">
        <div
          v-if="filteredExpenses.length === 0"
          class="bg-white rounded-2xl p-8 text-center border border-slate-200/80 text-slate-500 text-xs"
        >
          No expenses found matching the criteria.
        </div>

        <div
          v-for="item in filteredExpenses"
          :key="item.id"
          @click="toggleSelection(item.id)"
          :class="[
            'bg-white rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer shadow-xs flex items-center justify-between gap-3',
            isSelected(item.id)
              ? 'border-blue-400 ring-1 ring-blue-100'
              : 'border-slate-200/80 hover:border-slate-300',
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
              <span class="text-xs font-extrabold text-slate-900 tracking-wide uppercase truncate">
                {{ item.description }}
              </span>
              <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  v-if="item.cardBadge"
                  class="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded"
                >
                  {{ item.cardBadge }}
                </span>
                <span v-if="item.location" class="text-[11px] text-slate-500">
                  {{ item.location }} <span class="text-slate-300">•</span>
                </span>
                <span class="text-[11px] font-medium text-slate-500">
                  {{ item.date }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right: Amount & Category Status -->
          <div class="flex flex-col text-right shrink-0">
            <span class="text-sm font-extrabold text-slate-900 tracking-tight">
              £{{ Number(item.amount).toFixed(2) }}
            </span>
            <span class="text-[11px] font-bold text-amber-600 mt-0.5">
              {{ item.category || "Unknown" }}
            </span>
          </div>
        </div>
      </div>

      <!-- 7. Bottom Swipe Action Hint / Footer -->
      <div class="pt-2 pb-4 flex justify-center">
        <div
          class="bg-slate-200/70 text-slate-600 text-[11px] font-medium px-4 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-xs shadow-xs"
        >
          <span
            class="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold"
          >
            1
          </span>
          <span>Add swipe actions (swipe left to delete...)</span>
          <span
            class="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center text-[10px] font-bold"
          >
            2
          </span>
        </div>
      </div>
    </div>
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
