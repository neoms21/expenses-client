import { it, expect, describe, test } from 'vitest';
import { categoriseExpenses } from '@/transformers';

describe('Expenses transformer', () => {
  test('should categorise the expenses', () => {
    const result = categoriseExpenses(
      [
        {
          id: 'a1',
          amount: 10,
          description: 'D1',
          card_member: 'A',
          date: '2025-04-02T23:00:00.000Z',
          month: 'Mar',
          year: 2025,
          card: 'a',
        },
        {
          id: 'a2',
          amount: 8,
          description: 'D2',
          card_member: 'A',
          date: '2024-04-02T23:00:00.000Z',
          month: 'Mar',
          year: 2025,
          card: 'a',
        },
      ],
      [{ id: 1, category: 'AA', items: ['D1', 'D2'] }],
    );

    expect(result).toEqual([
      {
        id: expect.any(String),
        category: 'AA',
        total: '18.00',
        expenses: [
          {
            id: 'a1',
            amount: 10,
            category: 'AA',
            description: 'D1',
            card_member: 'A',
            date: '2025-04-02T23:00:00.000Z',
            month: 'Mar',
            year: 2025,
            card: 'a',
          },
          {
            id: 'a2',
            amount: 8,
            category: 'AA',
            description: 'D2',
            card_member: 'A',
            date: '2024-04-02T23:00:00.000Z',
            month: 'Mar',
            year: 2025,
            card: 'a',
          },
        ],
      },
    ]);
  });
});
