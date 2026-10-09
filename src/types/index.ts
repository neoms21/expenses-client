import type { TreeNode } from "primevue/treenode";

export interface Category {
  id: string;
  category: string;
  items: string[];
}

export type CategoryWithoutId = Omit<Category, "id">;

export interface Expense {
  id: string;
  amount: number;
  card: string;
  card_member: string;
  category: string;
  date: string;
  description: string;
  differentiator: string;
  month: string;
  year: number;
  tags?: string[] | null;
}

export interface Timeline {
  id: string;
  year: number;
  month: string;
  card: string;
  total: number;
}

export interface StrictTreeNode<T> extends TreeNode {
  data: T;
  children?: StrictTreeNode<T>[];
}

export type UiExpense = Omit<Expense, "card" | "differentiator">;

export type CategorisedExpenses = {
  category: string;
  total: string;
  expenses: Array<UiExpense>;
};
