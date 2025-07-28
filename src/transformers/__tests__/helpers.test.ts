import { it, expect, describe, test } from 'vitest';
import { assignCategory } from '../helpers';

const categories = [
  { id: 10, category: 'Squash', items: ['Sando', 'meadHurST'] },
  { id: 10, category: 'Shrey', items: ['Vanshika'] },
  { id: 10, category: 'Online', items: ['Paypal', 'Amazon', 'amzn'] },
  { id: 10, category: 'Holidays', items: ['ssxs', 'xx', 'yy'] },
];

describe('helpers  tests', () => {
  const testCases = [
    { description: 'sando', category: 'Squash' },
    { description: 'MEADHURsT', category: 'Squash' },
    { description: 'paypal   ', category: 'Online' },
    { description: 'Vanshika Paypal', category: 'Shrey' },
  ];

  test.each(testCases)(
    'Suitable category $category is returened for $description',
    ({ description, category }) => {
      const result = assignCategory(description, categories);

      expect(result).toEqual(category);
    },
  );

  test('When tags have the match, category is decided based on that', () => {
    const result = assignCategory('paypal airbnb', categories, ['holidays']);

    expect(result).toEqual('Holidays');
  });
});
