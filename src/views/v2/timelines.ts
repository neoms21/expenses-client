import { fetchTimelines } from "@/lib";
import type { Timeline } from "@/types/index";

import { groupBy, orderBy } from "lodash";
import { parse } from "date-fns/parse";

export type TreeNode = {
  key: string;
  label: string;
  data?: string;
  icon?: string;
  type?: "year" | "month" | "account";
  total?: number;
  count?: number;
  cardName?: string;
  cardSubtext?: string;
  cardBadge?: string;
  children: TreeNode[];
};

const defaultMockTimelines: Timeline[] = [
  { id: "tl-1", year: 2026, month: "Jan", card: "Amex Platinum", total: 1761.44 },
  { id: "tl-2", year: 2026, month: "Jan", card: "Debit Checking", total: 16779.51 },
  { id: "tl-3", year: 2026, month: "Jan", card: "HSBC Premier", total: 1393.0 },
  { id: "tl-4", year: 2026, month: "Feb", card: "HSBC Account", total: 2140.0 },
  { id: "tl-5", year: 2026, month: "Sep", card: "HSBC Account", total: 747.67 },
  { id: "tl-6", year: 2026, month: "Sep", card: "Amex Platinum", total: 320.5 },
];

const getCardBadge = (card: string): string => {
  const upper = card.toUpperCase();
  if (upper.includes("AMEX")) return "AMEX";
  if (upper.includes("HSBC")) return "HSBC";
  if (upper.includes("DEBIT") || upper.includes("CHECKING")) return "DEBIT";
  return "CARD";
};

const getCardSubtext = (card: string): string => {
  const upper = card.toUpperCase();
  if (upper.includes("AMEX")) return "•••• 4102";
  if (upper.includes("DEBIT") || upper.includes("CHECKING")) return "Primary checking";
  if (upper.includes("HSBC")) return "•••• 9382";
  return "•••• " + (card.length * 777).toString().slice(-4);
};

const convertToTreeNode = (timelines: Timeline[]): TreeNode[] => {
  const groupedData = groupBy(timelines, "year");

  return Object.keys(groupedData).map((year) => {
    const groupedByMonth = groupBy(groupedData[year], "month");

    let yearTotal = 0;
    const monthNodes: TreeNode[] = Object.keys(groupedByMonth).map((month) => {
      const monthItems = groupedByMonth[month] || [];
      let monthTotal = 0;

      const cardNodes: TreeNode[] = monthItems.map((timeline) => {
        const itemTotal = timeline.total || 0;
        monthTotal += itemTotal;
        return {
          key: `${year}-${month}-${timeline.card}`,
          label: `${timeline.card}`,
          data: `${timeline.card}`,
          type: "account",
          total: itemTotal,
          cardName: timeline.card,
          cardSubtext: getCardSubtext(timeline.card),
          cardBadge: getCardBadge(timeline.card),
          children: [],
        };
      });

      yearTotal += monthTotal;

      return {
        key: `${year}-${month}`,
        label: `${month}`,
        data: `${month}`,
        type: "month",
        total: monthTotal,
        count: cardNodes.length,
        children: cardNodes,
      };
    });

    return {
      key: `${year}`,
      label: `${year}`,
      data: `${year}`,
      type: "year",
      total: yearTotal,
      count: monthNodes.length,
      children: monthNodes,
    };
  });
};

const orderTimelinesByMonth = (timelines: Timeline[]): Timeline[] => {
  const dts = timelines.map((timeline) => ({
    ...timeline,
    dt: parse(`${timeline.month} ${timeline.year} 09:00`, "MMMM yyyy hh:mm", new Date()),
  }));

  return orderBy(dts, ["dt"], ["asc"]);
};

export const getTimelines = async (): Promise<TreeNode[]> => {
  const rawTimelines = await fetchTimelines();
  const timelines = rawTimelines && rawTimelines.length > 0 ? rawTimelines : defaultMockTimelines;

  return convertToTreeNode(orderTimelinesByMonth(timelines));
};
