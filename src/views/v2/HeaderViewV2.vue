<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute, RouterLink } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { Dialogs, useDialogStore } from "@/stores/dialogs";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const dialogStore = useDialogStore();

const isMobileMenuOpen = ref(false);

const navLinks = [
  { name: "home", path: "/", label: "Dashboard", icon: "pi pi-th-large" },
  { name: "tracker", path: "/tracker", label: "Tracker", icon: "pi pi-list-check" },
  { name: "reports", path: "/reports", label: "Reports", icon: "pi pi-chart-pie" },
  { name: "search", path: "/search", label: "Search", icon: "pi pi-search" },
  { name: "about", path: "/about", label: "About", icon: "pi pi-info-circle" },
];

const isActive = (path: string) => {
  if (path === "/") {
    return route.path === "/";
  }
  return route.path.startsWith(path);
};

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

const handleSignOut = () => {
  isMobileMenuOpen.value = false;
  authStore.logout();
  router.push({ name: "login" });
};

const handleOpenUpload = () => {
  isMobileMenuOpen.value = false;
  dialogStore.setVisibility(Dialogs.StatementsUpload, true);
};
</script>

<template>
  <!-- Universal Top Header -->
  <header class="flex items-center justify-between w-full py-1 gap-2 select-none">
    <!-- Left: Brand Logo & Desktop Routes or Mobile Burger Button -->
    <div class="flex items-center gap-2 sm:gap-3 min-w-0">
      <!-- Mobile Burger Button (Replaces "QUBITTECH Expense Manager" on mobile) -->
      <button
        @click="isMobileMenuOpen = true"
        class="md:hidden w-9 h-9 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs shrink-0"
        aria-label="Open navigation menu"
      >
        <i class="pi pi-bars text-sm" />
      </button>

      <!-- Desktop Navigation Routes (Replaces "QUBITTECH Expense Manager" on desktop) -->
      <nav class="hidden md:flex items-center gap-1 lg:gap-1.5 flex-wrap">
        <RouterLink
          v-for="item in navLinks"
          :key="item.path"
          :to="item.path"
          :class="[
            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
            isActive(item.path)
              ? 'bg-blue-600 text-white shadow-xs font-bold'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800/80',
          ]"
        >
          <i :class="item.icon" class="text-xs" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- Right: User Profile Pill & Sign Out -->
    <div class="flex items-center gap-2 shrink-0">
      <div
        class="flex items-center gap-2 bg-white dark:bg-slate-800/90 pl-1.5 pr-2 sm:pr-3 py-1 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs"
      >
        <div
          class="w-6 h-6 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-semibold text-[11px] flex items-center justify-center shrink-0"
        >
          {{ userInitials }}
        </div>
        <span
          class="hidden sm:inline-block text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-28 truncate"
        >
          {{ userDisplayName }}
        </span>
      </div>

      <button
        @click="handleSignOut"
        class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
        title="Sign out"
        aria-label="Sign out"
      >
        <i class="pi pi-sign-out text-sm" />
      </button>
    </div>

    <!-- Mobile Navigation Drawer / Modal -->
    <Teleport to="body">
      <!-- Backdrop -->
      <Transition name="fade">
        <div
          v-if="isMobileMenuOpen"
          @click="isMobileMenuOpen = false"
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden cursor-pointer"
        />
      </Transition>

      <!-- Side Drawer -->
      <Transition name="slide">
        <div
          v-if="isMobileMenuOpen"
          class="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 z-50 shadow-2xl border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-5 md:hidden font-sans"
        >
          <!-- Top section -->
          <div class="flex flex-col gap-5">
            <!-- Header row with Close button -->
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2.5">
                <div
                  class="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-extrabold text-xs"
                >
                  QT
                </div>
                <div class="flex flex-col">
                  <span
                    class="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider"
                  >
                    Expenses
                  </span>
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    Navigation
                  </span>
                </div>
              </div>

              <button
                @click="isMobileMenuOpen = false"
                class="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label="Close menu"
              >
                <i class="pi pi-times text-sm" />
              </button>
            </div>

            <hr class="border-slate-200/80 dark:border-slate-800" />

            <!-- Navigation Links List -->
            <nav class="flex flex-col gap-1.5">
              <RouterLink
                v-for="item in navLinks"
                :key="item.path"
                :to="item.path"
                @click="isMobileMenuOpen = false"
                :class="[
                  'px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-3 cursor-pointer',
                  isActive(item.path)
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
                ]"
              >
                <i :class="item.icon" class="text-sm" />
                <span class="text-sm">{{ item.label }}</span>
              </RouterLink>
            </nav>

            <hr class="border-slate-200/80 dark:border-slate-800" />

            <!-- Upload Statements Quick Action -->
            <button
              @click="handleOpenUpload"
              class="w-full py-2.5 px-3.5 rounded-2xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold flex items-center gap-2.5 transition cursor-pointer"
            >
              <i class="pi pi-upload text-sm" />
              <span>Upload Statement</span>
            </button>
          </div>

          <!-- Bottom: User info & Logout -->
          <div
            class="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between"
          >
            <div class="flex items-center gap-2.5 min-w-0">
              <div
                class="w-7 h-7 rounded-full bg-slate-800 dark:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center shrink-0"
              >
                {{ userInitials }}
              </div>
              <span class="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                {{ userDisplayName }}
              </span>
            </div>

            <button
              @click="handleSignOut"
              class="text-xs font-semibold text-red-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
            >
              <i class="pi pi-sign-out text-xs" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
}
</style>
