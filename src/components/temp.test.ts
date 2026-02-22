import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import ExpensesTable from './ExpensesTable.vue';
import PrimeVue from 'primevue/config';
import type { UiExpense } from '@/types';
import { useDialog } from 'primevue';

// Mocking composables
vi.mock('@/hooks/useCategories', () => ({
  useCategories: vi.fn(() => ({
    data: ref({
      data: [{ category: 'Groceries' }, { category: 'Utilities' }],
    }),
  })),
  useUpdateCategoryOnExpenses: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock('primevue/useDialog', () => ({
  useDialog: vi.fn(() => ({ open: vi.fn() })),
}));

describe('ExpensesTable.vue', () => {
  let wrapper;
  const refetchFn = vi.fn();
  const expenses: Array<Partial<UiExpense>> = [
    { id: '1', description: 'Lidl', amount: 50.5, date: '2023-10-10' },
    { id: '2', description: 'Aldi', amount: 70, date: '2023-10-11' },
  ];

  const mountComponent = (props = {}) => {
    return mount(ExpensesTable, {
      props: {
        expenses,
        selectedMonth: 'October',
        refetchFn,
        ...props,
      },
      global: {
        plugins: [PrimeVue],
        stubs: {
          // DataTable: {
          //   template:
          //     '<div><slot /><slot name="header" /><slot name="body" :data="expenses" /></div>',
          //   props: 'expenses',
          // },
          // Column: {
          //   template: '<div><slot name="body" :data="expenses" :rowData="expenses" /></div>',
          //   props: ['field', 'header', 'selectionMode', 'pt'],
          // },
          // Select: {
          //   template: '<select @change="$emit(\'change\', .target.value)"><slot /></select>',
          //   emits: ['change'],
          // },
          // Button: true,
          // Message: true,
          // Divider: true,
          // AssignCategory: true,
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.only('renders expenses table when expenses are provided', () => {
    wrapper = mountComponent();
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(true);
    expect(wrapper.text()).toContain('Expenses for October');
  });

  it.skip('does not render when there are no expenses', () => {
    wrapper = mountComponent({ expenses: [] });
    expect(wrapper.findComponent({ name: 'DataTable' }).exists()).toBe(false);
    expect(wrapper.html()).toBe('<!--v-if-->');
  });

  it.skip('disables "Assign Category" button when no expenses are selected', () => {
    wrapper = mountComponent();
    const assignButton = wrapper.findAllComponents({ name: 'Button' })[0];
    expect(assignButton.attributes('disabled')).toBe('');
  });

  it.skip('enables "Assign Category" button when at least one expense is selected', async () => {
    wrapper = mountComponent();
    // Simulate selection
    await wrapper.setData({ selectedExpenses: [expenses[0] as UiExpense] });
    const assignButton = wrapper.findAllComponents({ name: 'Button' })[0];
    expect(assignButton.attributes('disabled')).toBeUndefined();
  });

  it.skip('calls showAssignCategory when "Assign Category" button is clicked', async () => {
    const mockOpen = vi.fn();
    vi.mocked(useDialog).mockReturnValue({ open: mockOpen });

    wrapper = mountComponent();
    await wrapper.setData({ selectedExpenses: [expenses[0] as UiExpense] });

    const assignButton = wrapper.findAllComponents({ name: 'Button' })[0];
    await assignButton.trigger('click');

    expect(mockOpen).toHaveBeenCalled();
    expect(mockOpen.mock.calls[0][0].name).toBe('AssignCategory');
  });
});
