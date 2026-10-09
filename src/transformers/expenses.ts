import Decimal from "decimal.js";
import { groupBy } from "lodash";
import ShortUniqueId from "short-unique-id";
import { assignCategory } from "./helpers";
import type { Expense, Category, CategorisedExpenses } from "@/types/index";

export const categoriseExpenses = (
  expenses: Array<Omit<Expense, "category" | "differentiator" | "tags">>,
  categories: Category[],
): Array<CategorisedExpenses> => {
  if (expenses.length === 0) return [];

  const assignedCategoryExpenses = expenses.map((expense) => ({
    ...expense,
    category: assignCategory(expense.description, categories),
  }));

  const groupedByCategory = groupBy(assignedCategoryExpenses, "category");
  const result = Object.keys(groupedByCategory).map((category) => {
    const list = groupedByCategory[category] || [];
    return {
      category: category,
      id: new ShortUniqueId().rnd(),
      total: new Decimal(list.reduce((acc, expense) => acc + expense.amount, 0)).toFixed(2),
      expenses: list.sort((a, b) => Number(b.amount) - Number(a.amount)),
    };
  });
  return result.sort((a, b) => Number(b.total) - Number(a.total));
};
