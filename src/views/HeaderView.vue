<template>
  <div class="flex w-full">
    <Menubar
      :model="items"
      class="m-auto w-full lg:max-w-8/10"
      :pt="{
        rootList: ({ props }: any) => ({
          class: 'border-none',
        }),
        root: {
          class: 'bg-pink-500',
        },
      }"
    >
      <template #item="{ item, props, hasSubmenu }">
        <router-link
          v-if="item.route"
          v-slot="{ href, navigate, isExactActive }"
          :to="item.route"
          custom
        >
          <a
            v-ripple
            :href="href"
            v-bind="props.action"
            @click="navigate"
            :class="{
              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold':
                isExactActive,
            }"
          >
            <span :class="item.icon" />
            <span class="ml-2">{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
          <span :class="item.icon" />
          <span class="ml-2">{{ item.label }}</span>
          <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down ml-2" />
        </a>
      </template>
      <template #end>
        <div v-if="authStore.isAuthenticated" class="flex items-center gap-3">
          <div class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <i class="pi pi-user text-gray-500" />
            <span class="font-medium truncate max-w-48" :title="displayName">
              {{ displayName }}
            </span>
          </div>
          <Button
            icon="pi pi-sign-out"
            severity="secondary"
            text
            rounded
            size="small"
            title="Sign out"
            aria-label="Sign out"
            @click="handleLogout"
          />
        </div>
      </template>
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { Dialogs, useDialogStore } from "@/stores/dialogs";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const authStore = useAuthStore();
const { setVisibility } = useDialogStore();

const displayName = computed(() => authStore.userDisplayName);

const handleLogout = () => {
  authStore.logout();
  router.push({ name: "login" });
};

const items = ref([
  {
    label: "Tracker",
    icon: "pi pi-mobile",
    route: "/tracker",
  },
  {
    label: "Expenses",
    icon: "pi pi-palette",
    route: "/reports",
  },
  {
    label: "Timeline",
    icon: "pi pi-calendar",
    route: "/",
  },
  {
    label: "Search",
    icon: "pi pi-search",
    route: "/search",
  },
  {
    label: "Upload Statement",
    icon: "pi pi-upload",
    command: () => {
      setVisibility(Dialogs.StatementsUpload, true);
    },
  },
]);
</script>
