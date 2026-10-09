<template>
  <div class="flex justify-center">
    <Select
      v-model="selectedPosition"
      :options="jobCategories"
      optionLabel="label"
      optionValue="value"
      optionGroupLabel="label"
      optionGroupChildren="items"
      placeholder="Select a position..."
      class="w-full md:w-56"
    />
  </div>
  <!--
 <div
        class="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs flex items-center justify-between hover:border-slate-300 transition cursor-pointer"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-sm flex items-center justify-center"
          >
            {{ selectedAccount.code }}
          </div>
          <div class="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
            <span>{{ selectedAccount.period }}</span>
            <span class="text-slate-300">•</span>
            <span class="text-slate-600">{{ selectedAccount.name }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-bold text-slate-900">{{ selectedAccount.total }}</span>
          <i class="pi pi-chevron-down text-xs text-slate-400" />
        </div>
      </div> -->
</template>

<script setup lang="ts">
import { ref } from "vue";

const selectedPosition = ref(null);
const jobCategories = ref([
  {
    label: "Engineering",
    value: "eng",
    items: [
      { label: "Frontend Developer", value: "frontend" },
      { label: "Backend Developer", value: "backend" },
      { label: "Full Stack Developer", value: "fullstack" },
      { label: "DevOps Engineer", value: "devops" },
      {
        label: "QA Engineer",
        value: "qa",
        items: [
          { label: "Growth Manager", value: "growth" },
          { label: "Content Strategist", value: "content" },
          { label: "SEO Specialist", value: "seo" },
        ],
      },
    ],
  },
]);
</script>
