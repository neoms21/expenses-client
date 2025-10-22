<script setup lang="ts">
import { defineProps, ref } from 'vue';
import type { Category, UiExpense } from '@/types';
import { useCategories, useInsertCategory, useUpdateCategory } from '@/hooks/useCategories';
import { extractTagsFromDescription } from '@/utils/extractTags';

const props = defineProps<{
  expense: UiExpense;
}>();

// Define the emit event
const emit = defineEmits(['onSuccessfulSave']);
const { data: result } = useCategories();

const { mutate: insertCategory } = useInsertCategory();
const { mutate: updateCategory } = useUpdateCategory();

const tags = ref(extractTagsFromDescription(props.expense.description));

const selectedTags = ref([]);
const selectedCategory = ref<Category>();
const newCategory = ref('');

const saveExpenseToCategory = async () => {
  if (newCategory.value) {
    await insertCategory({
      category: newCategory.value,
      items: [...selectedTags.value],
    });

    emit('onSuccessfulSave', {
      category: newCategory.value,
      items: [...selectedTags.value],
    });
  } else if (selectedCategory.value) {
    await updateCategory({
      category: selectedCategory.value,

      newItems: selectedTags.value,
    });

    emit('onSuccessfulSave', {
      category: selectedCategory.value.category,
      items: [...selectedCategory.value.items, ...selectedTags.value],
    });
  }
};

const isSaveDisabled = () => {
  if (newCategory.value.length >= 5 && selectedTags.value.length) return false;
  else if (selectedTags.value.length && selectedCategory.value) return false;

  return true;
};
</script>
<template>
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <div class="">
      <div class="flex flex-col gap-2">
        <div class="flex gap-3">
          <h4 class="font-bold">Description:</h4>
          <span>{{ expense.description }} - {{ expense.amount }} </span>
        </div>
        <div class="flex gap-3 items-center">
          <h4 class="font-bold">Tags:</h4>
          <div v-for="tag in tags" :key="tag.key">
            <div class="flex items-center gap-2">
              <Checkbox
                v-model="selectedTags"
                :inputId="tag.key"
                name="category"
                :value="tag.name"
              />
              <label :for="tag.key">{{ tag.name }}</label>
            </div>
          </div>
        </div>
      </div>
      <hr class="my-2" />
      <div v-if="result?.data" class="flex flex-col gap-2">
        <h3 class="font-bold">Select from existing categories</h3>
        <div v-for="category in result?.data" :key="category.category" class="flex gap-2">
          <RadioButton
            v-model="selectedCategory"
            :inputId="category.category"
            name="dynamic"
            :value="category"
          />
          <label :for="category.category" class="font-bold">{{ category.category }}</label>

          <div>{{ category.items.join(', ') }}</div>
        </div>
      </div>
      <h2 class="text-2xl my-2">OR</h2>
      <div class="flex justify-between">
        <IftaLabel>
          <InputText id="newCategory" v-model="newCategory" variant="filled" />
          <label for="newCategory">Add new category</label>
        </IftaLabel>
        <Button class="self-end" :disabled="isSaveDisabled()" v-on:click="saveExpenseToCategory"
          >Save</Button
        >
      </div>
    </div>
  </div>
</template>
