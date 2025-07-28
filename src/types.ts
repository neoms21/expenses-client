import type { TreeNode } from 'primevue/treenode';
import type { Database } from './lib/database.types';

export type Expense = Database['public']['Tables']['expenses']['Row'];
export type Timeline = Database['public']['Views']['timeline']['Row'];
export type Category = Pick<
  Database['public']['Tables']['categories']['Row'],
  'category' | 'items' | 'id'
>;

export type CategoryWithoutId = Omit<Category, 'id'>;
export interface StrictTreeNode<T> extends TreeNode {
  data: T;
  children?: StrictTreeNode<T>[];
}

export type ExpenseView = {
  amount: number;
  category: string;
  date: string;
  description: string;
  id: string;
  month: string;
  year: number;
  card_member: string;
};

export type CategorisedExpenses = {
  category: string;
  total: string;
  expenses: Array<ExpenseView>;
};

export interface X {
  name: String;
  gender: String;
}
