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
        <router-link v-if="item.route" v-slot="{ href, navigate }" :to="item.route" custom>
          <a v-ripple :href="href" v-bind="props.action" @click="navigate">
            <span :class="item.icon" />
            <span>{{ item.label }}</span>
          </a>
        </router-link>
        <a v-else v-ripple :href="item.url" :target="item.target" v-bind="props.action">
          <span :class="item.icon" />
          <span>{{ item.label }}</span>
          <span v-if="hasSubmenu" class="pi pi-fw pi-angle-down" />
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
    label: 'Reports',
    icon: 'pi pi-palette',
    route: '/reports',
  },
  {
    label: 'Dashboard',
    icon: 'pi pi-link',
    route: '/',
  },
  {
    label: 'External',
    icon: 'pi pi-home',
  },
  {
    label: 'Upload Statement',
    icon: 'pi pi-upload',
    command: () => {
      console.log('in Command');
      setVisibility(Dialogs.StatementsUpload, true);
    },
  },
]);
</script>
