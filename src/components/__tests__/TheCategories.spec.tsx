import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/vue';
import TheCategories from '../TheCategories.vue';
import { ref, defineComponent } from 'vue';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import type { UiExpense } from '@/types/index';

const { mockInsertCategory, mockUpdateCategory, mockUpdateCategoryOnExpenses, mockSearchExpenses } =
  vi.hoisted(() => ({
    mockInsertCategory: vi.fn(() => Promise.resolve(true)),
    mockUpdateCategory: vi.fn(() => Promise.resolve(true)),
    mockUpdateCategoryOnExpenses: vi.fn(() => Promise.resolve(true)),
    mockSearchExpenses: vi.fn(() =>
      Promise.resolve({
        data: [
          { id: 'exp-2', description: 'Lidl groceries' },
          { id: 'exp-3', description: 'Lidl shopping' },
        ],
      }),
    ),
  }));

vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: ref({
      data: [
        { id: 1, category: 'Groceries', items: ['Lidl', 'Aldi'] },
        { id: 2, category: 'Utilities', items: ['Water', 'Electric'] },
        { id: 3, category: 'Exclude', items: ['Random'] },
      ],
    }),
  })),
  useInsertCategory: vi.fn(() => ({
    mutateAsync: mockInsertCategory,
  })),
  useUpdateCategory: vi.fn(() => ({
    mutateAsync: mockUpdateCategory,
  })),
  useUpdateCategoryOnExpenses: vi.fn(() => ({
    mutateAsync: mockUpdateCategoryOnExpenses,
  })),
}));

vi.mock('@/lib/expenses', () => ({
  searchExpenses: mockSearchExpenses,
}));

const stubs = {
  Checkbox: defineComponent({
    template:
      '<input type="checkbox" :value="value" :checked="isChecked" @change="onChange" data-testid="tag-checkbox" />',
    props: ['value', 'modelValue'],
    computed: {
      isChecked(): boolean {
        return Array.isArray(this.modelValue)
          ? this.modelValue.includes(this.value)
          : !!this.modelValue;
      },
    },
    methods: {
      onChange(e: Event) {
        const target = e.target as HTMLInputElement;
        if (Array.isArray(this.modelValue)) {
          const newValue = [...this.modelValue];
          if (target.checked) {
            newValue.push(this.value);
          } else {
            const idx = newValue.indexOf(this.value);
            if (idx > -1) newValue.splice(idx, 1);
          }
          this.$emit('update:modelValue', newValue);
        } else {
          this.$emit('update:modelValue', target.checked);
        }
      },
    },
  }),
  RadioButton: defineComponent({
    template:
      '<input type="radio" :value="value" :checked="isChecked" @click="onClick" :data-testid="pt?.root?.[\'data-testid\'] || $attrs[\'data-testid\']" />',
    props: ['value', 'modelValue', 'pt'],
    computed: {
      isChecked(): boolean {
        return this.modelValue?.category === this.value?.category;
      },
    },
    methods: {
      onClick() {
        this.$emit('update:modelValue', this.value);
      },
    },
  }),
  InputText: defineComponent({
    template:
      '<input type="text" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'size'],
  }),
  Button: defineComponent({
    template: '<button :disabled="disabled"><slot /></button>',
    props: ['disabled'],
  }),
  Toast: true,
  IftaLabel: {
    template: '<div><slot /></div>',
  },
};

const mockClose = vi.fn();

const renderTheCategories = (expense: Partial<UiExpense>) => {
  return render(TheCategories, {
    global: {
      plugins: [PrimeVue, ToastService],
      provide: {
        dialogRef: ref({
          data: {
            expense,
            expenseIds: expense.id ? [expense.id] : [],
          },
          close: mockClose,
        }),
      },
      stubs,
    },
  });
};

describe('TheCategories.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it('renders the component with description and extracted tags', async () => {
    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl food groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    expect(await screen.findByText(/Lidl food groceries/i)).toBeDefined();
    expect(await screen.findByText(/45.99/i)).toBeDefined();

    const checkboxes = await screen.findAllByTestId('tag-checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  it('allows creating a new category with selected tags', async () => {
    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl food groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    const checkboxes = (await screen.findAllByTestId('tag-checkbox')) as HTMLInputElement[];
    await fireEvent.click(checkboxes[0]!); // Lidl
    await fireEvent.click(checkboxes[2]!); // groceries

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const newManualTagInput = inputs[0]!;
    await fireEvent.update(newManualTagInput, ''); // Clear pre-populated manual tag
    const newCategoryInput = inputs[1]!;
    await fireEvent.update(newCategoryInput, 'Supermarkets');

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveBtn);

    expect(mockInsertCategory).toHaveBeenCalledWith({
      category: 'Supermarkets',
      items: ['Lidl', 'groceries'],
    });

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('allows updating an existing category with manual tag', async () => {
    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl food groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    await screen.findAllByTestId('tag-checkbox');
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const newManualTagInput = inputs[0]!;
    await fireEvent.update(newManualTagInput, 'Supermarkets'); // Clear pre-populated manual tag

    const radioBtn = screen.getByTestId('Exclude');
    await fireEvent.click(radioBtn);

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveBtn);

    expect(mockUpdateCategory).toHaveBeenCalledWith({
      category: { id: 3, category: 'Exclude', items: ['Random'] },
      newItems: ['Random', 'Supermarkets'],
    });

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('allows creating a new category with new manual tag', async () => {
    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl food groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    const checkboxes = (await screen.findAllByTestId('tag-checkbox')) as HTMLInputElement[];
    await fireEvent.click(checkboxes[0]!); // Lidl
    await fireEvent.click(checkboxes[2]!); // groceries

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const newManualTagInput = inputs[0]!;
    await fireEvent.update(newManualTagInput, ''); // Clear pre-populated manual tag
    const newCategoryInput = inputs[1]!;
    await fireEvent.update(newCategoryInput, 'Supermarkets');

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveBtn);

    expect(mockInsertCategory).toHaveBeenCalledWith({
      category: 'Supermarkets',
      items: ['Lidl', 'groceries'],
    });

    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
    });
  });

  it('prompts bulk assignment if matching expenses are found', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    const radios = (await screen.findAllByRole('radio')) as HTMLInputElement[];
    await fireEvent.click(radios[0]!); // Groceries category

    const checkboxes = (await screen.findAllByTestId('tag-checkbox')) as HTMLInputElement[];
    await fireEvent.click(checkboxes[0]!); // Lidl tag

    const saveBtn = screen.getByRole('button', { name: 'Save' });
    await fireEvent.click(saveBtn);

    expect(mockUpdateCategory).toHaveBeenCalled();
    expect(mockSearchExpenses).toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledWith(
      'There are 2 other expenses that match these tags. Would you like to assign them to "Groceries" as well?',
    );

    expect(mockUpdateCategoryOnExpenses).toHaveBeenCalledWith({
      category: 'Groceries',
      expenseIds: ['exp-2', 'exp-3'],
    });
  });

  it('clears selectedCategory when anything is typed in new Category input text', async () => {
    renderTheCategories({
      id: 'test-expense',
      description: 'Lidl food groceries',
      amount: 45.99,
      category: 'Uncategorized',
    });

    const radios = (await screen.findAllByRole('radio')) as HTMLInputElement[];
    await fireEvent.click(radios[0]!); // Groceries category
    expect(radios[0]!.checked).toBe(true);

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const newCategoryInput = inputs[1]!;
    await fireEvent.update(newCategoryInput, 'Supermarkets');

    expect(radios[0]!.checked).toBe(false);
  });
});
