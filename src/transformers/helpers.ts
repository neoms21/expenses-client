import type { Category } from '@/types';

const existsInList = (val: string, arr: string[]) => {
  // console.log('🚀 ~ existsInList ~ val:', val, arr);

  return arr.find((a) => val.trim().toLowerCase().indexOf(a.toLowerCase()) !== -1);
};

export const assignCategory = (
  description: string,
  categories: Category[],
  tags: string[] = [],
): string => {
  for (const { category, items } of categories) {
    if (tags.length > 0) {
      console.log('in tags', tags);
      if (category.toLowerCase().indexOf(tags[0].toLowerCase()) !== -1) return category;
    } else if (existsInList(description, items)) return category;
  }

  return 'Unknown';
};
