// src/hooks/useArticles.js
import { fetchTimelines } from '@/lib';
import { useQuery } from '@tanstack/vue-query';

export function useTimelines() {
  return useQuery({
    queryKey: ['timelines'],
    queryFn: () => fetchTimelines(),
    staleTime: Infinity,
  });
}
