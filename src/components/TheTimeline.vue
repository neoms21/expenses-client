<script setup lang="ts">
import { useReportInputs } from '@/composables/useReportInputs';
import { ref, onMounted } from 'vue';
import { getTimelines } from '@/services';

const nodes = ref();
const selectedKey = ref({});

useReportInputs(selectedKey);

onMounted(async () => {
  const res = await getTimelines();
  nodes.value = res || [];
});
</script>
<template>
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <div class="flex-1 flex flex-column gap-5">
      <Tree
        v-model:selectionKeys="selectedKey"
        :value="nodes"
        :filter="true"
        selectionMode="checkbox"
      />
    </div>
  </div>
</template>
