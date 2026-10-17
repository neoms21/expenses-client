<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useReportInputs } from "@/composables/useReportInputs";
import { getTimelines, type TreeNode } from "@/views/v2/timelines";

const isOpen = ref(false);
const nodes = ref<TreeNode[]>([]);
const selectedKey = ref<Record<string, { checked: boolean }>>({});

useReportInputs(selectedKey);

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape" && isOpen.value) {
    isOpen.value = false;
  }
};

onMounted(async () => {
  window.addEventListener("keydown", handleKeydown);
  const res = await getTimelines();
  nodes.value = res || [];

  // Default selection if empty (matching screenshot: 3 accounts selected in Jan 2026)
  if (Object.keys(selectedKey.value).length === 0 && nodes.value.length > 0) {
    selectedKey.value = {};
  }

  // Nothing selected yet: open the list by default
  if (selectedCount.value === 0) {
    isOpen.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});

// Calculate selected leaf accounts count
const selectedCount = computed(() => {
  return Object.keys(selectedKey.value).filter(
    (k) => selectedKey.value[k]?.checked && k.split("-").length === 3,
  ).length;
});

// Calculate total sum of selected account nodes
const selectedTotalAmount = computed(() => {
  let total = 0;
  const findTotal = (nodeList: TreeNode[]) => {
    for (const node of nodeList) {
      if (node.type === "account" && selectedKey.value[node.key]?.checked) {
        total += node.total || 0;
      }
      if (node.children && node.children.length > 0) {
        findTotal(node.children);
      }
    }
  };
  findTotal(nodes.value);
  return total;
});

// Primary summary text for top bar trigger card
const triggerSummary = computed(() => {
  const count = selectedCount.value;
  if (count === 0) return { title: "Select Accounts & Dates", subtitle: "No filters applied" };
  if (count === 1) return { title: "1 Account Selected", subtitle: "Filtered transactions" };
  return { title: `${count} Accounts & Dates`, subtitle: "Active transaction filter" };
});

const resetSelection = () => {
  selectedKey.value = {};
};

const applyFilters = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="w-full">
    <!-- 1. Top Bar / Trigger Card (Default state in page flow) -->
    <div
      @click="isOpen = true"
      class="bg-white dark:bg-slate-900 rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs flex items-center justify-between hover:border-blue-300 dark:hover:border-slate-700 transition cursor-pointer select-none group"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center border border-blue-200/60 dark:border-blue-800/60 shrink-0 group-hover:scale-105 transition-transform"
        >
          <i class="pi pi-sliders-h text-sm" />
        </div>
        <div class="flex flex-col min-w-0">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
              {{ triggerSummary.title }}
            </span>
            <span
              v-if="selectedCount > 0"
              class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 shrink-0"
            >
              {{ selectedCount }} selected
            </span>
          </div>
          <span class="text-[11px] font-medium text-slate-400 truncate">
            {{ triggerSummary.subtitle }}
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <span class="text-sm font-black text-slate-900 dark:text-white tracking-tight">
          £{{ selectedTotalAmount.toFixed(2) }}
        </span>
        <i
          class="pi pi-chevron-down text-xs text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition"
        />
      </div>
    </div>

    <!-- 2. Full Page Filter View (Only displayed when Top Bar is clicked) -->
    <Teleport to="body">
      <!-- Desktop Backdrop (clicking outside closes the drawer) -->
      <Transition name="backdrop">
        <div
          v-if="isOpen"
          @click="isOpen = false"
          class="fixed inset-0 bg-slate-950/50 backdrop-blur-xs z-50 hidden lg:block cursor-pointer"
        />
      </Transition>

      <Transition name="drawer">
        <div
          v-if="isOpen"
          class="fixed inset-0 lg:inset-y-0 lg:left-0 lg:right-auto lg:w-[440px] bg-[#0b1329] text-white z-50 overflow-y-auto p-4 sm:p-6 lg:p-6 flex flex-col justify-between font-sans antialiased lg:border-r lg:border-slate-800 lg:shadow-2xl"
        >
          <div
            class="w-full max-w-md mx-auto lg:max-w-none flex flex-col flex-1 gap-4 min-h-screen lg:min-h-0 sm:min-h-0"
          >
            <!-- Full Page Header -->
            <div class="flex flex-col gap-2 pt-2 shrink-0">
              <div class="flex items-center justify-between">
                <button
                  @click="isOpen = false"
                  class="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
                >
                  <i class="pi pi-arrow-left text-xs" />
                  <span>Back</span>
                </button>

                <button
                  @click="resetSelection"
                  class="text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <div class="flex items-center justify-between mt-1">
                <div class="flex items-center gap-2.5">
                  <h1 class="text-xl sm:text-2xl font-bold text-white tracking-tight">
                    Filter Accounts & Dates
                  </h1>
                  <span
                    v-if="selectedCount > 0"
                    class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-950 text-blue-300 border border-blue-800/80"
                  >
                    {{ selectedCount }} selected
                  </span>
                </div>
              </div>

              <p class="text-xs text-slate-400 font-normal">
                Select months and linked payment accounts to filter transactions.
              </p>
            </div>

            <!-- Full Page Tree Container -->
            <div
              class="flex-1 overflow-y-auto my-2 bg-[#0f172a] rounded-3xl p-4 border border-slate-800/90 shadow-2xl custom-tree-scrollbar min-h-[380px]"
            >
              <Tree
                v-model:selectionKeys="selectedKey"
                :value="nodes"
                selectionMode="checkbox"
                class="custom-dark-tree bg-transparent text-slate-100 border-0 p-0"
              >
                <template #default="slotProps">
                  <div class="flex items-center justify-between w-full py-1 text-sm select-none">
                    <!-- Level 0: Year Node -->
                    <template v-if="slotProps.node.type === 'year'">
                      <span class="font-extrabold text-white text-base tracking-tight">
                        {{ slotProps.node.label }}
                      </span>
                      <span
                        class="text-[11px] bg-slate-800/90 text-slate-300 border border-slate-700/80 px-2.5 py-0.5 rounded-lg font-semibold"
                      >
                        £{{
                          Number(slotProps.node.total || 0).toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                          })
                        }}
                        total
                      </span>
                    </template>

                    <!-- Level 1: Month Node -->
                    <template v-else-if="slotProps.node.type === 'month'">
                      <div class="flex items-center gap-2">
                        <span class="font-bold text-slate-100 text-sm">
                          {{ slotProps.node.label }}
                        </span>
                        <span class="text-xs text-slate-400 font-medium">
                          {{ slotProps.node.count }} accounts
                        </span>
                      </div>
                      <span class="text-xs font-bold text-slate-200">
                        £{{
                          Number(slotProps.node.total || 0).toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                          })
                        }}
                      </span>
                    </template>

                    <!-- Level 2: Account / Card Node -->
                    <template v-else>
                      <div class="flex items-center gap-3 my-0.5 min-w-0">
                        <!-- Account Brand Logo Badge -->
                        <div
                          :class="[
                            'w-8 h-8 rounded-xl text-[10px] font-extrabold flex items-center justify-center border shrink-0 shadow-xs',
                            slotProps.node.cardBadge === 'AMEX'
                              ? 'bg-blue-900/90 text-blue-200 border-blue-700'
                              : slotProps.node.cardBadge === 'HSBC'
                                ? 'bg-red-950/90 text-red-300 border-red-800'
                                : 'bg-emerald-950/90 text-emerald-300 border-emerald-800',
                          ]"
                        >
                          {{ slotProps.node.cardBadge }}
                        </div>
                      </div>
                      <span class="text-xs font-bold text-slate-200 shrink-0 ml-2">
                        £{{
                          Number(slotProps.node.total || 0).toLocaleString("en-GB", {
                            minimumFractionDigits: 2,
                          })
                        }}
                      </span>
                    </template>
                  </div>
                </template>
              </Tree>
            </div>

            <!-- Bottom Action Bar -->
            <div class="pt-2 pb-4 shrink-0">
              <button
                @click="applyFilters"
                class="w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <span
                  >Apply Filters ({{ selectedCount }} selected • £{{
                    selectedTotalAmount.toFixed(2)
                  }})</span
                >
                <i class="pi pi-check text-xs" />
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
/* Drawer & Backdrop Transitions */
.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
  transform: translateX(-100%);
}
@media (max-width: 1023px) {
  .drawer-enter-from,
  .drawer-leave-to {
    transform: none;
    opacity: 0;
  }
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

/* Customizing PrimeVue Tree for sleek dark theme */
.custom-dark-tree .p-tree-root {
  background: transparent !important;
  color: #f8fafc !important;
  border: 0 !important;
  padding: 0 !important;
}

.custom-dark-tree .p-tree-node {
  padding: 3px 0 !important;
}

.custom-dark-tree .p-tree-node-content {
  border-radius: 12px !important;
  padding: 8px 10px !important;
  transition: background-color 0.15s ease !important;
}

.custom-dark-tree .p-tree-node-content:hover {
  background-color: rgba(30, 41, 59, 0.8) !important;
}

.custom-dark-tree .p-tree-node-selected .p-tree-node-content {
  background-color: rgba(30, 58, 138, 0.4) !important;
  border: 1px solid rgba(59, 130, 246, 0.4) !important;
}

.custom-dark-tree .p-checkbox .p-checkbox-box {
  background-color: #1e293b !important;
  border-color: #475569 !important;
  border-radius: 6px !important;
}

.custom-dark-tree .p-checkbox-checked .p-checkbox-box {
  background-color: #2563eb !important;
  border-color: #3b82f6 !important;
}

.custom-dark-tree .p-tree-node-toggle-button {
  color: #94a3b8 !important;
}
</style>
