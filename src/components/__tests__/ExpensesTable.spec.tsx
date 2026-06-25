import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/vue';
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

    expect(screen.getByText('Office Suppl...')).toBeDefined();
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
});
