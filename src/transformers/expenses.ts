import type { CategorisedExpenses, Category, Expense, ExpenseView, StrictTreeNode } from '@/types';
import Decimal from 'decimal.js';
import { groupBy } from 'lodash';
import { format } from 'date-fns';
import ShortUniqueId from 'short-unique-id';
import { assignCategory } from './helpers';

export const categoriseExpenses = (
  expenses: Array<Omit<Expense, 'category' | 'differentiator' | 'tags'>>,
  categories: Category[],
): Array<CategorisedExpenses> => {
  if (expenses.length === 0) return [];

  const assignedCategoryExpenses = expenses.map((expense) => ({
    ...expense,
    category: assignCategory(expense.description, categories),
  }));

  const groupedByCategory = groupBy(assignedCategoryExpenses, 'category');
  const result = Object.keys(groupedByCategory).map((category) => {
    return {
      category: category,
      id: new ShortUniqueId().rnd(),
      total: new Decimal(
        groupedByCategory[category].reduce((acc, expense) => acc + expense.amount, 0),
      ).toFixed(2),
      expenses: groupedByCategory[category].sort((a, b) => Number(b.amount) - Number(a.amount)),
    };
  });
  return result.sort((a, b) => Number(b.total) - Number(a.total));
};
