import { useQuery } from '@tanstack/vue-query'
import { fetchTopology } from '../api/megaportClient'

// TanStack Query (in Megaport's stack) handles caching, loading & error states,
// and background refetch — exactly how you'd consume the Portal API in production.
export function useTopology() {
  return useQuery({
    queryKey: ['megaport', 'topology'],
    queryFn: fetchTopology,
    staleTime: 30_000,
    retry: 1,
  })
}
