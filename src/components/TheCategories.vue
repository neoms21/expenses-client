<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue';
import type { Category, UiExpense } from '@/types/index';
import {
  useCategories,
  useInsertCategory,
  useUpdateCategory,
  useUpdateCategoryOnExpenses,
} from '@/hooks/useCategories';
import { extractTagsFromDescription } from '@/utils/extractTags';
import { useToast } from 'primevue/usetoast';
import { searchExpenses } from '@/lib/expenses';

const toast = useToast();
const dialogRef: any = inject('dialogRef');
const expense = ref<UiExpense>();
const selectedExpenseIds = ref<string[]>([]);

const tags = ref<
  {
    name: string;
    key: string;
  }[]
>([]);

onMounted(() => {
  const params = dialogRef.value.data;
  expense.value = params.expense;
  selectedExpenseIds.value = params.expenseIds || [];
  tags.value = extractTagsFromDescription(expense.value?.description);
  newManualTag.value = expense.value?.description || '';
});

// Define the emit event
const emit = defineEmits(['onSuccessfulSave']);
const { data: result } = useCategories();

const { mutateAsync: insertCategory } = useInsertCategory();
const { mutateAsync: updateCategory } = useUpdateCategory();
const { mutateAsync: updateCategoryOnExpenses } = useUpdateCategoryOnExpenses();

const selectedTags = ref([]);
const selectedCategory = ref<Category>();
const newCategory = ref('');
const newManualTag = ref('');

watch(newCategory, (val) => {
  if (val) {
    selectedCategory.value = undefined;
  }
});

watch(selectedCategory, (val) => {
  if (val) {
    newCategory.value = '';
  }
});

const saveExpenseToCategory = async () => {
  let categoryName = '';
  let categoryTags: string[] = newManualTag.value ? [newManualTag.value] : [...selectedTags.value];

  try {
    if (selectedExpenseIds.value.length > 1) {
      await updateCategoryOnExpenses({
        category: newCategory.value || selectedCategory.value?.category || 'Uncategorized',
        expenseIds: selectedExpenseIds.value,
      });
      // emit('onSuccessfulSave', {
      //   category: categoryName,
      //   items: categoryTags,
      // });
      if (dialogRef?.value?.close) {
        dialogRef.value.close();
      }
      return;
    }

    if (newCategory.value) {
      categoryName = newCategory.value;
      await insertCategory({
        category: categoryName,
        items: categoryTags,
      });
    } else if (selectedCategory.value) {
      categoryName = selectedCategory.value.category;
      categoryTags = [...selectedCategory.value.items, ...categoryTags];
      await updateCategory({
        category: selectedCategory.value,
        newItems: categoryTags,
      });
    }

    // Check for other expenses matching the rules
    const { data: matchingExpenses } = await searchExpenses(
      newManualTag?.value || categoryTags.join(' '),
    );

    if (matchingExpenses && matchingExpenses.length > 0) {
      const confirmed = confirm(
        `There are ${matchingExpenses.length} other expenses that match these tags. Would you like to assign them to "${categoryName}" as well?`,
      );

      if (confirmed) {
        const ids = matchingExpenses.map((e) => e.id);
        await updateCategoryOnExpenses({ category: categoryName, expenseIds: ids });
      }
    }

    // Always assign category to the current expense that was selected/focused
    if (expense.value?.id && expense.value.category !== categoryName) {
      await updateCategoryOnExpenses({ category: categoryName, expenseIds: [expense.value.id] });
    }

    emit('onSuccessfulSave', {
      category: categoryName,
      items: categoryTags,
    });

    if (dialogRef?.value?.close) {
      dialogRef.value.close();
    }
  } catch (error: any) {
    console.error('Error saving category rules:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to save category rules.',
      life: 5000,
    });
  }
};

const isSaveDisabled = () => {
  if (selectedExpenseIds.value.length > 0 && selectedCategory.value) return false;

  const hasTag = selectedTags.value.length > 0 || !!newManualTag.value;
  return !(hasTag && (newCategory.value.length >= 5 || selectedCategory.value));
};
</script>

<template>
  <Toast />
  <div class="card flex flex-col flex-wrap justify-content-center gap-5">
    <div class="">
      <div v-if="selectedExpenseIds.length === 1" class="flex flex-col gap-2">
        <div class="flex gap-3">
          <h4 class="font-bold">Description:</h4>
          <span>{{ expense?.description }} - {{ expense?.amount }} </span>
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
          <InputText
            size="small"
            id="newTag"
            v-model="newManualTag"
            variant="outlined"
            class="text-xs flex-1"
          />
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
            :pt="{ root: { 'data-testid': category.category } }"
          />
          <label :for="category.category" class="font-bold">{{ category.category }}</label>

          <div v-if="selectedExpenseIds.length === 1" class="text-xs">
            {{ category.items?.join(', ') }}
          </div>
        </div>
      </div>
      <h2 class="text-2xl my-2">OR</h2>
      <div class="flex justify-between">
        <IftaLabel>
          <InputText
            id="newCategory"
            v-model="newCategory"
            variant="filled"
            @focus="selectedCategory = undefined"
          />
          <label for="newCategory">Add new category</label>
        </IftaLabel>
        <Button class="self-end" :disabled="isSaveDisabled()" v-on:click="saveExpenseToCategory"
          >Save</Button
        >
      </div>
    </div>
  </div>
</template>
