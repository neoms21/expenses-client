import { fetchTimelines } from '@/lib';
import type { Timeline } from '@/types';

import { groupBy, orderBy } from 'lodash';
import { parse } from 'date-fns/parse';

type TreeNode = {
  key: string;
  label: string;
  data?: string;
  icon?: string;
  children: TreeNode[];
};

const convertToTreeNode = (timelines: Timeline[]): TreeNode[] => {
  const groupedData = groupBy(timelines, 'year');

  return Object.keys(groupedData).map((year) => {
    const groupedByMonth = groupBy(groupedData[year], 'month');

    return {
      key: `${year}`,
      label: `${year}`,
      data: `${year}`,
      children: Object.keys(groupedByMonth).map((month) => {
        return {
          key: `${year}-${month}`,
          label: `${month}`,
          data: `${month}`,
          children: groupedByMonth[month].map((timeline) => ({
            key: `${year}-${month}-${timeline.card}`,
            label: `${timeline.card} -  ${timeline.total}`,
            data: `${timeline.card}`,
            children: [],
          })),
        };
      }),
    };
  });
};

const orderTimelinesByMonth = (timelines: Timeline[]): Timeline[] => {
  const dts = timelines.map((timeline) => ({
    ...timeline,
    dt: parse(`${timeline.month} ${timeline.year} 09:00`, 'MMMM yyyy hh:mm', new Date()),
  }));

  return orderBy(dts, ['dt'], ['asc']);
};

export const getTimelines = async () => {
  const timelines = (await fetchTimelines()) || [];

  return convertToTreeNode(orderTimelinesByMonth(timelines));
};
