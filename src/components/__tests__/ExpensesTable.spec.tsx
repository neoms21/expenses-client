import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/vue';
import ExpensesTable, { type ExpensesTableProps } from '../ExpensesTable.vue';
import { ref } from 'vue';
import PrimeVue from 'primevue/config';
import type { UiExpense } from '@/types';

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

  const renderWithPrimeVue = (data: ExpensesTableProps) =>
    render(ExpensesTable, {
      props: { ...data },
      global: {
        plugins: [PrimeVue],
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
});
