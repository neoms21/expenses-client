<script setup lang="ts">
import { computed, onMounted } from "vue";
import { RouterView, useRoute } from "vue-router";
import HeaderViewV2 from "./views/v2/HeaderViewV2.vue";
import { useAuthStore } from "./stores/auth";

const route = useRoute();
const authStore = useAuthStore();

const showHeader = computed(
  () => authStore.isAuthenticated && route.name !== "login" && !route.meta?.hideHeader,
);

onMounted(() => {
  if (authStore.isAuthenticated) {
    authStore.refreshAuth();
  }
});
</script>

<template>
  <FileUploadDialog v-if="authStore.isAuthenticated" />

  <!-- Universal Mobile-First Container Frame for Desktop & Mobile -->
  <div
    class="min-h-screen bg-[#e2e8f0] dark:bg-slate-950 flex justify-center font-sans antialiased text-slate-800 dark:text-slate-100"
  >
    <div
      :class="[
        'w-full mx-auto px-4 sm:px-5 pt-4 pb-8 flex flex-col gap-4 bg-[#eff4f9] dark:bg-slate-900 min-h-screen shadow-sm',
        route.meta?.wide
          ? 'max-w-md lg:max-w-none lg:px-8 lg:border-x-0 border-x border-slate-300/60 dark:border-slate-800/80'
          : 'max-w-md border-x border-slate-300/60 dark:border-slate-800/80',
      ]"
    >
      <!-- Universal Header at Top of Every Page -->
      <HeaderViewV2 v-if="showHeader" />

      <!-- Active Page Content -->
      <div class="flex-1 w-full">
        <RouterView />
      </div>
    </div>
  </div>

  <DynamicDialog />
</template>

<style scoped>
header {
  line-height: 1.5;
}
</style>
