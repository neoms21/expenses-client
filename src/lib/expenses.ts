import { pb } from "./dbClient";
import type { ExpensesInput } from "@/composables/useReportInputs";
import type { Expense } from "@/types/index";

const EXPENSES_COLS = "month,description,amount,id,date,category,card_member";

export const fetchExpenses = async (params: ExpensesInput, category: string) => {
  try {
    const filterParts: string[] = [];

    if (params.years && params.years.length > 0) {
      const yearFilters = params.years.map((y) => `year = ${Number(y)}`).join(" || ");
      filterParts.push(`(${yearFilters})`);
    }
    if (params.months && params.months.length > 0) {
      const monthFilters = params.months.map((m) => `month = "${m}"`).join(" || ");
      filterParts.push(`(${monthFilters})`);
    }
    if (params.cards && params.cards.length > 0) {
      const cardFilters = params.cards.map((c) => `card = "${c}"`).join(" || ");
      filterParts.push(`(${cardFilters})`);
    }

    filterParts.push(`category = "${category}"`);
    filterParts.push(`category != "Exclude"`);
    filterParts.push(`amount >= 0`);

    const filter = filterParts.join(" && ");

    const records = await pb.collection("expenses").getFullList<Expense>({
      filter,
      sort: "-amount",
      fields: "id,amount,date,card_member,description,month,year,card",
    });

    return { data: records, error: null };
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return { data: [], error };
  }
};

export const fetchCategoryExpenses = async (params: ExpensesInput) => {
  try {
    const filterParts: string[] = [];

    if (params.years && params.years.length > 0) {
      const yearFilters = params.years.map((y) => `year = ${Number(y)}`).join(" || ");
      filterParts.push(`(${yearFilters})`);
    }
    if (params.months && params.months.length > 0) {
      const monthFilters = params.months.map((m) => `month = "${m}"`).join(" || ");
      filterParts.push(`(${monthFilters})`);
    }
    if (params.cards && params.cards.length > 0) {
      const cardFilters = params.cards.map((c) => `card = "${c}"`).join(" || ");
      filterParts.push(`(${cardFilters})`);
    }

    const filter = filterParts.length > 0 ? filterParts.join(" && ") : "";

    const records = await pb.collection("category_expenses_summary").getFullList<{
      category: string;
      count: number;
      total: number;
    }>({ filter });

    const aggregated: Record<string, { category: string; count: number; total: number }> = {};
    for (const r of records) {
      if (!aggregated[r.category]) {
        aggregated[r.category] = { category: r.category, count: 0, total: 0 };
      }
      const agg = aggregated[r.category]!;
      agg.count += r.count;
      agg.total += r.total;
    }

    return { data: Object.values(aggregated), error: null };
  } catch (error) {
    console.error("Error fetching category expenses:", error);
    return { data: [], error };
  }
};

export const updateCategoryOnExpenses = async (category: string, expenseIds: string[]) => {
  try {
    const batch = pb.createBatch();
    for (const id of expenseIds) {
      batch.collection("expenses").update(id, { category });
    }
    await batch.send();
  } catch (error) {
    console.error("Error updating category on expenses:", error);
  }
};

export const deleteExpenses = async (expenseIds: string[]) => {
  try {
    const batch = pb.createBatch();
    for (const id of expenseIds) {
      batch.collection("expenses").delete(id);
    }
    const data = await batch.send();
    return { data, error: null };
  } catch (error) {
    console.error("Error deleting expenses:", error);
    return { data: null, error };
  }
};

export const fetchDashboardData = async (params?: ExpensesInput) => {
  try {
    let filter = "";
    if (params?.years?.length) {
      filter = params.years.map((y) => `year = ${Number(y)}`).join(" || ");
    }
    const records = await pb.collection("get_dashboard").getFullList<{
      id: string;
      year: number;
      category: string;
      amount: number;
    }>({ filter });

    return { data: records, error: null };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { data: [], error };
  }
};

export const fetchCategorisedExpensesByMonths = async (category: string) => {
  try {
    const records = await pb.collection("category_expenses_summary").getFullList<{
      month: string;
      category: string;
      total: number;
    }>({
      filter: `category = "${category}"`,
    });

    const aggregated: Record<string, number> = {};
    for (const r of records) {
      aggregated[r.month] = (aggregated[r.month] || 0) + r.total;
    }

    const data = Object.keys(aggregated).map((month) => ({
      month,
      sum: aggregated[month],
    }));

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching monthly categorised expenses:", error);
    return { data: [], error };
  }
};

export const fetchExpensesByMonth = async (month: string, category: string) => {
  try {
    const records = await pb.collection("expenses").getFullList<Expense>({
      filter: `month = "${month}" && category = "${category}" && amount > 0`,
      sort: "-amount",
      fields: EXPENSES_COLS,
    });
    return { data: records, error: null };
  } catch (error) {
    console.error("Error fetching expenses by month:", error);
    return { data: [], error };
  }
};

export const searchExpenses = async (query: string, includeExcluded: boolean = false) => {
  try {
    let filter = `description ~ "${query}" || differentiator ~ "${query}" || category ~ "${query}"`;
    if (!includeExcluded) {
      filter = `(${filter}) && category != "Exclude"`;
    }
    const records = await pb.collection("expenses").getFullList<Expense>({
      filter,
      sort: "-amount",
      fields: EXPENSES_COLS,
    });
    return { data: records, error: null };
  } catch (error) {
    console.error("Error searching expenses:", error);
    return { data: [], error };
  }
};

export const fetchYears = async () => {
  try {
    const records = await pb.collection("timeline").getFullList<{ year: number }>({
      fields: "year",
    });
    const years = Array.from(new Set(records.map((r) => r.year)))
      .filter((y): y is number => y !== null && y !== undefined)
      .sort((a, b) => b - a);
    return years;
  } catch (error) {
    console.error("Error fetching years:", error);
    return [];
  }
};
