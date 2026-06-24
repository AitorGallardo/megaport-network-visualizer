import { ref, watch } from 'vue'
import type { Topology, VXC } from '../types/megaport'
import { useTopology } from './useTopology'
import { createVxc, updateVxc, type CreateVxcInput, type UpdateVxcInput } from '../api/megaportClient'

// A mutable view of the topology: seeds from the read query, then applies
// create / update / shutdown operations locally so the graph reacts live.
// Each operation also calls the real Megaport write endpoint (no-op in mock mode).

export function useTopologyStore() {
  const query = useTopology()
  const topology = ref<Topology>({ nodes: [], vxcs: [] })
  const busy = ref(false)
  const lastAction = ref<string | null>(null)

  // seed once data arrives (and re-seed on refetch)
  watch(
    () => query.data.value,
    (data) => {
      // deep-clone via JSON (data is plain JSON-safe). structuredClone() can't
      // clone the reactive proxy TanStack Query returns → DataCloneError.
      if (data) topology.value = JSON.parse(JSON.stringify(data))
    },
    { immediate: true },
  )

  async function addVxc(input: CreateVxcInput) {
    busy.value = true
    try {
      const { productUid } = await createVxc(input)
      const vxc: VXC = {
        productUid: productUid || `vxc-${Date.now()}`,
        productName: input.productName,
        type: 'VXC',
        status: 'DEPLOYABLE',
        rateLimit: input.rateLimit,
        aEndUid: input.aEndProductUid,
        bEndUid: input.bEndProductUid,
        vlan: input.aEndVlan,
      }
      topology.value = { ...topology.value, vxcs: [...topology.value.vxcs, vxc] }
      lastAction.value = `Created “${input.productName}” (DEPLOYABLE)`
    } finally {
      busy.value = false
    }
  }

  async function editVxc(productUid: string, changes: UpdateVxcInput) {
    busy.value = true
    try {
      await updateVxc(productUid, changes)
      topology.value = {
        ...topology.value,
        vxcs: topology.value.vxcs.map((v) => {
          if (v.productUid !== productUid) return v
          const next: VXC = { ...v }
          if (changes.name != null) next.productName = changes.name
          if (changes.rateLimit != null) next.rateLimit = changes.rateLimit
          if (changes.aEndVlan != null) next.vlan = changes.aEndVlan
          // Admin shut-down is separate from lifecycle status — the VXC stays
          // LIVE/CONFIGURED, it's just administratively up or down.
          if (changes.shutdown != null) next.shutDown = changes.shutdown
          return next
        }),
      }
      lastAction.value = changes.shutdown != null
        ? `${changes.shutdown ? 'Shut down' : 'Re-enabled'} VXC`
        : 'Updated VXC'
    } finally {
      busy.value = false
    }
  }

  return {
    topology,
    busy,
    lastAction,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    addVxc,
    editVxc,
  }
}
