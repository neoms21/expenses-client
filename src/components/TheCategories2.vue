<script setup lang="ts">
import { defineProps, ref } from 'vue';
import type { Category, UiExpense } from '@/types';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from 'primevue';
const toast = useToast();

const props = defineProps<{
  expenses: Array<UiExpense>;
}>();

// Define the emit event
const emit = defineEmits(['onCategoryAssignment']);
const { data: result } = useCategories();

const selectedCategory = ref<Category>();

const newCategory = ref('');

const saveExpenseToCategory = async () => {
  if (newCategory.value.length < 5 && !selectedCategory.value) {
    console.error('No category');
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Please enter a new category or select an existing category',
      life: 3000,
    });
    return;
  }

  emit('onCategoryAssignment', newCategory.value || selectedCategory?.value?.category);
};
</script>
<template>
  <Toast />
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <div class="">
      <div v-if="result?.data" class="flex flex-col gap-2">
        <div class="flex justify-between">
          <h3 class="font-medium">Select from existing categories</h3>
          <Button
            variant="link"
            v-show="!!selectedCategory"
            v-on:click="selectedCategory = undefined"
            >Clear</Button
          >
        </div>
        <div class="card flex justify-start">
          <Select
            v-model="selectedCategory"
            editable
            :options="result?.data || []"
            optionLabel="category"
            placeholder="Select a category"
            class="w-full md:w-56"
          />
        </div>
      </div>
      <h2 class="text-2xl my-2">OR</h2>
      <div class="flex justify-between">
        <IftaLabel>
          <InputText
            :disabled="!!selectedCategory"
            id="newCategory"
            v-model="newCategory"
            variant="filled"
          />
          <label for="newCategory">Add new category</label>
        </IftaLabel>
        <Button class="self-end" v-on:click="saveExpenseToCategory">Save</Button>
      </div>
    </div>
  </div>
</template>
