import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'
import type { Topology } from '../types/megaport'

// Synthetic live utilisation (0..1) per LIVE VXC, nudged on an interval via a
// clamped random walk so the topology feels alive. Purely cosmetic — it stands
// in for the real telemetry the Portal shows, without claiming to be real.
export function useTraffic(source: MaybeRefOrGetter<Topology>, intervalMs = 1400) {
  const utilization = ref<Record<string, number>>({})

  function refresh() {
    const next: Record<string, number> = {}
    for (const v of toValue(source).vxcs) {
      if (v.status !== 'LIVE' || v.shutDown) continue
      const prev = utilization.value[v.productUid] ?? 0.3 + Math.random() * 0.45
      const drift = (Math.random() - 0.5) * 0.22
      next[v.productUid] = Math.min(0.98, Math.max(0.08, prev + drift))
    }
    utilization.value = next
  }

  refresh()
  const timer = setInterval(refresh, intervalMs)
  // re-seed when VXCs are added/removed
  watch(() => toValue(source).vxcs.length, refresh)
  onScopeDispose(() => clearInterval(timer))

  return { utilization }
}
