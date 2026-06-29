import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
import ExpensesTable, { type ExpensesTableProps } from '../ExpensesTable.vue';
import { ref, defineComponent } from 'vue';
import PrimeVue from 'primevue/config';
import type { UiExpense } from '@/types/index';

describe('ExpensesTable.vue', () => {
  const mockExpenses: UiExpense[] = [
    {
      id: '1',
      date: '2024-03-20',
      description: 'Office Supplies',
      category: 'Work',
      amount: 45.99,
      card_member: '',
      month: '',
      tags: null,
      year: 0,
    },
    {
      id: '2',
      date: '2024-03-21',
      description: 'Team Lunch',
      category: 'Food',
      amount: 120.5,
      card_member: '',
      month: '',
      tags: null,
      year: 0,
    },
  ];
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

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
  vi.mock('primevue/usedialog', () => ({
    useDialog: vi.fn(() => ({ open: vi.fn() })),
  }));
  vi.mock('@/hooks/useExpenses', () => ({
    useDeleteExpenses: vi.fn(() => ({
      mutateAsync: vi.fn(),
    })),
  }));

  const renderWithPrimeVue = (data: ExpensesTableProps) =>
    render(ExpensesTable, {
      props: { ...data },
      global: {
        plugins: [PrimeVue],
        stubs: {
          Button: {
            template: '<button :disabled="disabled"><slot /></button>',
            props: ['disabled'],
          },
          Select: {
            template: `
              <select :value="modelValue" @change="$emit('update:modelValue', $event.target.value)" aria-label="Group by column">
                <option v-for="opt in options" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            `,
            props: ['modelValue', 'options'],
          },
          Accordion: defineComponent({
            template: '<div class="p-accordion" data-testid="accordion"><slot /></div>',
            props: ['value', 'multiple'],
            emits: ['update:value'],
            data() {
              return {
                expandedValues: this.value || [] as string[]
              };
            },
            methods: {
              togglePanel(panelValue: string) {
                const idx = this.expandedValues.indexOf(panelValue);
                if (idx > -1) {
                  this.expandedValues.splice(idx, 1);
                } else {
                  this.expandedValues.push(panelValue);
                }
                this.$emit('update:value', [...this.expandedValues]);
              }
            },
            provide() {
              return {
                accordionState: this
              };
            },
            watch: {
              value(newVal: string[]) {
                this.expandedValues = newVal || [];
              }
            }
          }),
          AccordionPanel: defineComponent({
            template: '<div class="p-accordion-panel"><slot /></div>',
            props: ['value'],
            inject: ['accordionState'],
            computed: {
              isOpen() {
                return (this.accordionState as any).expandedValues.includes(this.value);
              }
            },
            methods: {
              toggle() {
                (this.accordionState as any).togglePanel(this.value);
              }
            },
            provide() {
              return {
                panelState: this
              };
            }
          }),
          AccordionHeader: defineComponent({
            template: '<button class="p-accordion-header" @click="panelState.toggle()"><slot /></button>',
            inject: ['panelState']
          }),
          AccordionContent: defineComponent({
            template: '<div v-if="panelState.isOpen" class="p-accordion-content"><slot /></div>',
            inject: ['panelState']
          }),
        },
      },
    });

  it('renders the correct number of expense rows', () => {
    renderWithPrimeVue({ expenses: mockExpenses, refetchFn: () => {}, selectedMonth: '2024-03' });
    const rows = screen.getAllByRole('row');
    // Includes header row + data rows
    expect(rows).toHaveLength(mockExpenses.length + 1);
  });

  it('displays expense details correctly in the table', () => {
    renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });

    expect(screen.getByText('Office Supplies')).toBeDefined();
    expect(screen.getByText('45.99')).toBeDefined();
    expect(screen.getByText('Team Lunch')).toBeDefined();
    expect(screen.getByText('120.5')).toBeDefined();
  });

  it('renders an empty state message when no expenses are provided', () => {
    renderWithPrimeVue({ expenses: [], selectedMonth: '2024-03', refetchFn: () => {} });

    expect(screen.getByText(/no expenses found for 2024-03/i)).toBeDefined();
  });

  it('renders a disabled Delete button by default', () => {
    renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });
    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    expect(deleteBtn).toBeDefined();
    expect(deleteBtn.hasAttribute('disabled')).toBe(true);
  });

  it('triggers delete mutation and refetch when Delete button is clicked and confirmed', async () => {
    const mockDelete = vi.fn().mockResolvedValue({});
    const mockRefetch = vi.fn();
    const { useDeleteExpenses } = await import('@/hooks/useExpenses');
    vi.mocked(useDeleteExpenses).mockReturnValue({
      mutateAsync: mockDelete,
    } as any);

    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: mockRefetch,
      selectedMonth: '2024-03',
    });

    const checkboxes = screen.getAllByRole('checkbox');
    await fireEvent.click(checkboxes[1]!);

    const deleteBtn = screen.getByRole('button', { name: 'Delete' });
    expect(deleteBtn.hasAttribute('disabled')).toBe(false);

    await fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalledWith(['1']);
    expect(mockRefetch).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('renders the Group by dropdown', () => {
    renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });

    const select = screen.getByLabelText('Group by column') as HTMLSelectElement;
    expect(select).toBeDefined();
    
    const optionLabels = Array.from(select.options).map(o => o.text.trim());
    expect(optionLabels).toEqual(['None', 'Description', 'Amount', 'Category', 'Date']);
    
    const optionValues = Array.from(select.options).map(o => o.value);
    expect(optionValues).toEqual(['None', 'description', 'amount', 'category', 'date']);
  });

  it('groups expenses correctly when a group option is selected', async () => {
    const { container } = renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });

    // Verify no group headers are present initially
    let groupHeaders = container.querySelectorAll('.p-accordion-header');
    expect(groupHeaders.length).toBe(0);

    const select = screen.getByLabelText('Group by column');
    expect(select).toBeDefined();

    // Select "Category"
    await fireEvent.update(select, 'category');

    // Now verify the group headers are rendered
    groupHeaders = container.querySelectorAll('.p-accordion-header');
    expect(groupHeaders.length).toBe(2); // 'Work' and 'Food' groups

    expect(screen.getByText('Category: Work')).toBeDefined();
    expect(screen.getByText('Category: Food')).toBeDefined();

    // Work has 1 item, Food has 1 item
    const itemsBadges = screen.getAllByText('1 items');
    expect(itemsBadges.length).toBe(2);

    expect(screen.getByText('Total: $45.99')).toBeDefined();
    expect(screen.getByText('Total: $120.50')).toBeDefined();
  });

  it('orders groups descending based on the number of items in each group', async () => {
    const threeExpenses = [
      ...mockExpenses,
      {
        id: '3',
        date: '2024-03-22',
        description: 'Printer ink',
        category: 'Work',
        amount: 80.0,
        card_member: '',
        month: '',
        tags: null,
        year: 0,
      }
    ];

    const { container } = renderWithPrimeVue({
      expenses: threeExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });

    const select = screen.getByLabelText('Group by column');
    await fireEvent.update(select, 'category');

    // Verify group headers
    const groupHeaders = container.querySelectorAll('.p-accordion-header');
    expect(groupHeaders.length).toBe(2);

    // Work (2 items) should be the first group, and Food (1 item) should be the second
    const headerTexts = Array.from(groupHeaders).map(el => el.textContent || '');
    expect(headerTexts[0]).toContain('Category: Work');
    expect(headerTexts[0]).toContain('2 items');
    expect(headerTexts[0]).toContain('Total: $125.99');

    expect(headerTexts[1]).toContain('Category: Food');
    expect(headerTexts[1]).toContain('1 items');
    expect(headerTexts[1]).toContain('Total: $120.50');
  });

  it('collapses groups by default and expands them when clicked', async () => {
    const { container } = renderWithPrimeVue({
      expenses: mockExpenses,
      refetchFn: () => {},
      selectedMonth: '2024-03',
    });

    const select = screen.getByLabelText('Group by column');
    await fireEvent.update(select, 'category');

    // By default, groups should be collapsed.
    // Verify that the body data rows are not visible
    expect(screen.queryByText('Office Supplies')).toBeNull();
    expect(screen.queryByText('Team Lunch')).toBeNull();

    // Find the toggle headers
    const toggleHeaders = container.querySelectorAll('.p-accordion-header');
    expect(toggleHeaders.length).toBe(2);

    // Expand the second group (Work category, index 1)
    await fireEvent.click(toggleHeaders[1]!);

    // Now, 'Office Supplies' (belonging to 'Work') should be visible,
    // but 'Team Lunch' (belonging to 'Food') should still be hidden
    expect(screen.getByText('Office Supplies')).toBeDefined();
    expect(screen.queryByText('Team Lunch')).toBeNull();
  });
});
