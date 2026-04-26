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
        <router-link v-if="item.route" v-slot="{ href, navigate, isExactActive }" :to="item.route" custom>
          <a v-ripple :href="href" v-bind="props.action" @click="navigate" :class="{ 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold': isExactActive }">
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
    </Menubar>
  </div>
</template>

<script setup lang="ts">
import { Dialogs, useDialogStore } from '@/stores/dialogs';
import { ref } from 'vue';
const { setVisibility } = useDialogStore();
const items = ref([
  {
    label: 'Expenses',
    icon: 'pi pi-palette',
    route: '/reports',
  },
  {
    label: 'Timeline',
    icon: 'pi pi-calendar',
    route: '/',
  },
  {
    label: 'Search',
    icon: 'pi pi-search',
    route: '/search',
  },
  {
    label: 'Upload Statement',
    icon: 'pi pi-upload',
    command: () => {
      setVisibility(Dialogs.StatementsUpload, true);
    },
  },
]);
</script>
