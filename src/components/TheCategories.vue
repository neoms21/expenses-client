<script setup lang="ts">
import { ref, inject, onMounted, watch, computed } from 'vue';
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
const searchQuery = ref('');
const showCreateNewCategory = ref(false);

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

const filteredCategories = computed(() => {
  if (!result.value?.data) return [];
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return result.value.data;
  return result.value.data.filter(
    (c) =>
      c.category.toLowerCase().includes(query) ||
      c.items?.some((item) => item.toLowerCase().includes(query)),
  );
});

const categoriesWithTags = computed(() => {
  return filteredCategories.value.filter((c) => c.items && c.items.length > 0);
});

const categoriesWithoutTags = computed(() => {
  return filteredCategories.value.filter((c) => !c.items || c.items.length === 0);
});

const toggleTagSelection = (tagName: string) => {
  const index = selectedTags.value.indexOf(tagName as never);
  if (index > -1) {
    selectedTags.value.splice(index, 1);
  } else {
    selectedTags.value.push(tagName as never);
  }
};

const closeDialog = () => {
  if (dialogRef?.value?.close) {
    dialogRef.value.close();
  }
};

const saveExpenseToCategory = async () => {
  let categoryName = '';
  let categoryTags: string[] = newManualTag.value ? [newManualTag.value] : [...selectedTags.value];

  try {
    if (selectedExpenseIds.value.length > 1) {
      categoryName = newCategory.value || selectedCategory.value?.category || 'Uncategorized';
      await updateCategoryOnExpenses({
        category: categoryName,
        expenseIds: selectedExpenseIds.value,
      });
      emit('onSuccessfulSave', {
        category: categoryName,
        items: categoryTags,
      });
      if (dialogRef?.value?.close) {
        dialogRef.value.close(true);
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
      dialogRef.value.close(true);
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
  <!-- Custom Header Bar -->
  <div
    class="flex items-center justify-between px-5 py-4 border-b border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-900 select-none rounded-t-2xl"
  >
    <Button
      icon="pi pi-times"
      variant="text"
      severity="secondary"
      class="h-8 w-8 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"
      @click="closeDialog"
    />
    <span class="font-extrabold text-base text-slate-800 dark:text-slate-200"
      >Assign Category Rules</span
    >
    <Button
      label="Save"
      variant="text"
      class="font-extrabold text-sm text-blue-600 hover:text-blue-700 dark:text-orange-500 dark:hover:text-orange-600 p-0"
      :disabled="isSaveDisabled()"
      @click="saveExpenseToCategory"
    />
  </div>

  <div class="p-5 flex flex-col gap-5 bg-slate-50 dark:bg-slate-950 rounded-b-2xl">
    <!-- SECTION 1: DESCRIPTION & TAGS -->
    <div
      class="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xs flex flex-col gap-5"
    >
      <!-- DESCRIPTION section -->
      <div>
        <span class="text-[10px] font-bold text-slate-400 tracking-wider block mb-1"
          >DESCRIPTION</span
        >
        <span
          v-if="selectedExpenseIds.length <= 1"
          class="text-sm font-bold text-slate-800 dark:text-slate-200"
          >{{ expense?.description }} - {{ expense?.amount }}
        </span>
        <div v-else class="flex items-center gap-2">
          <span
            class="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs px-2.5 py-1 rounded-full font-bold"
          >
            {{ selectedExpenseIds.length }} Selected
          </span>
          <p class="text-sm font-bold text-orange-600 dark:text-orange-400 truncate flex-1">
            {{ expense?.description }}
          </p>
        </div>
      </div>

      <!-- TAGS section -->
      <div class="flex flex-col gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span class="text-[10px] text-slate-400 font-bold tracking-wider">TAGS</span>
        <!-- Extracted Checkbox tags -->
        <div
          v-if="selectedExpenseIds.length === 0 && tags.length > 0"
          class="flex flex-wrap gap-2 mb-1"
        >
          <div
            v-for="tag in tags"
            :key="tag.key"
            class="flex items-center gap-2 px-3 py-1.5 border text-orange-600 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer select-none"
            @click="toggleTagSelection(tag.name)"
          >
            <Checkbox
              v-model="selectedTags"
              :inputId="tag.key"
              name="category"
              :value="tag.name"
              data-testid="tag-checkbox"
              @click.stop
            />
            <label
              :for="tag.key"
              class="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer"
              >{{ tag.name }}</label
            >
          </div>
        </div>
        <!-- Manual Tag Input text box -->
        <InputText
          size="small"
          id="newTag"
          data-testid="new-tag-input"
          v-model="newManualTag"
          variant="outlined"
          class="text-xs w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl"
          placeholder="e.g. Lidl"
        />
      </div>
    </div>

    <!-- SECTION 2: SEARCH BAR -->
    <div class="relative w-full">
      <InputText
        v-model="searchQuery"
        :placeholder="`Search ${result?.data?.length || 0} categories...`"
        class="pl-10 w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 rounded-full"
        data-testid="search-category-input"
      />
      <i class="pi pi-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
    </div>

    <!-- SECTION 3: EXISTING CATEGORIES BLOCK (3-COLUMN RESPONSIVE GRID) -->
    <div class="flex flex-col gap-3">
      <h3 class="text-xs font-bold tracking-wider text-slate-400 uppercase select-none">
        EXISTING CATEGORIES
      </h3>

      <!-- 3-Column Responsive Grid -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[350px] overflow-y-auto pr-1"
      >
        <!-- Categories with tags -->
        <div
          v-for="category in categoriesWithTags"
          :key="category.category"
          class="flex items-start justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 bg-white dark:bg-slate-800 shadow-xs"
          :class="[
            selectedCategory?.category === category.category
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 dark:border-orange-500 dark:ring-orange-500/20 dark:bg-orange-50/5'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-350 hover:bg-slate-50/50',
          ]"
          @click="selectedCategory = category"
        >
          <div class="flex flex-col gap-2">
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{
              category.category
            }}</span>
            <div class="flex flex-wrap gap-1">
              <span
                v-for="item in category.items"
                :key="item"
                :class="[
                  category.category.toLowerCase() === 'exclude'
                    ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-800'
                    : 'bg-slate-100  text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800',
                ]"
                class="px-2 py-0.5 border rounded text-[10px] uppercase font-bold tracking-wider"
              >
                {{ item }}
              </span>
            </div>
          </div>
          <RadioButton
            v-model="selectedCategory"
            :inputId="category.category"
            name="dynamic"
            :value="category"
            :pt="{ root: { 'data-testid': category.category } }"
            @click.stop="selectedCategory = category"
          />
        </div>

        <!-- Categories without tags -->
        <div
          v-for="category in categoriesWithoutTags"
          :key="category.category"
          class="flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all duration-200 bg-white dark:bg-slate-800 shadow-xs"
          :class="[
            selectedCategory?.category === category.category
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10 dark:border-orange-500 dark:ring-orange-500/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-350 hover:bg-slate-50/50',
          ]"
          @click="selectedCategory = category"
        >
          <span class="text-sm font-bold text-slate-800 dark:text-slate-200 truncate mr-2">{{
            category.category
          }}</span>
          <RadioButton
            v-model="selectedCategory"
            :inputId="category.category"
            name="dynamic"
            :value="category"
            :pt="{ root: { 'data-testid': category.category } }"
            @click.stop="selectedCategory = category"
          />
        </div>

        <!-- Create New Category Dashed Trigger inside the grid -->
        <div
          v-if="!showCreateNewCategory"
          class="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-orange-500 hover:bg-blue-50/10 cursor-pointer transition-all duration-200 text-slate-400 hover:text-blue-500 dark:hover:text-orange-500 select-none min-h-[72px]"
          @click="showCreateNewCategory = true"
        >
          <i class="pi pi-plus-circle text-base"></i>
          <span class="text-xs font-bold">Create New Category</span>
        </div>
      </div>
    </div>

    <!-- SECTION 4: INLINE NEW CATEGORY FORM & SUMMARY & SAVE BUTTON -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
      <!-- Left side: New Category Form -->
      <div
        v-if="showCreateNewCategory"
        class="p-4 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl flex flex-col gap-4 relative shadow-xs animate-fadein"
      >
        <div class="flex items-center justify-between">
          <span class="text-[10px] font-bold text-slate-400 tracking-wider">NEW CATEGORY</span>
          <Button
            icon="pi pi-times"
            variant="text"
            severity="secondary"
            size="small"
            class="h-6 w-6"
            @click="showCreateNewCategory = false"
          />
        </div>
        <IftaLabel>
          <InputText
            id="newCategory"
            data-testid="new-category-input"
            v-model="newCategory"
            variant="filled"
            class="w-full"
            @focus="selectedCategory = undefined"
          />
          <label for="newCategory">Category Name</label>
        </IftaLabel>
      </div>
      <div v-else class="hidden md:block"></div>

      <!-- Right side: Selection Summary and Save Action -->
      <div
        class="flex flex-col gap-3 justify-end bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm"
      >
        <div
          class="text-xs text-slate-500 flex flex-col gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl shadow-xs"
        >
          <div class="flex justify-between items-center">
            <span>Target Category:</span>
            <span class="font-extrabold text-slate-800 dark:text-slate-200">
              {{ newCategory || selectedCategory?.category || 'None Selected' }}
            </span>
          </div>
          <div
            v-if="selectedExpenseIds.length === 0"
            class="flex justify-between items-start gap-2"
          >
            <span>Rule Tags:</span>
            <span
              class="font-extrabold text-slate-800 dark:text-slate-200 max-w-[200px] truncate text-right"
            >
              {{ newManualTag || selectedTags.join(', ') || 'None' }}
            </span>
          </div>
        </div>

        <Button
          class="w-full py-2.5 font-bold text-sm bg-blue-600 hover:bg-blue-700 border-none rounded-xl transition-all shadow-md hover:shadow-lg text-white"
          :disabled="isSaveDisabled()"
          @click="saveExpenseToCategory"
        >
          Save
        </Button>
      </div>
    </div>
  </div>
</template>
