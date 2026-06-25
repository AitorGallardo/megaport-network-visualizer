import { ref, toRaw, watch } from 'vue'
import type { ProvisioningStatus, Topology, VXC } from '../types/megaport'
import { useTopology } from './useTopology'
import {
  createVxc,
  updateVxc,
  setMockVxcStatus,
  dataSourceLabel,
  type CreateVxcInput,
  type UpdateVxcInput,
} from '../api/megaportClient'

// A mutable view of the topology: seeds from the read query, then applies
// create / update / shutdown operations locally so the graph reacts live.
// Each operation also calls the real Megaport write endpoint (no-op in mock mode).

export type Notice = { kind: 'ok' | 'error'; text: string }

/** Simulated provisioning timeline (mock mode): a new VXC climbs to LIVE. */
const PROVISIONING_STEPS: { status: ProvisioningStatus; at: number }[] = [
  { status: 'CONFIGURED', at: 1600 },
  { status: 'LIVE', at: 3400 },
]

export function useTopologyStore() {
  const query = useTopology()
  const topology = ref<Topology>({ nodes: [], vxcs: [] })
  const busy = ref(false)
  const notice = ref<Notice | null>(null)

  // seed once data arrives (and re-seed on refetch). toRaw() unwraps the
  // reactive proxy so structuredClone can copy it (it can't clone a proxy).
  watch(
    () => query.data.value,
    (data) => {
      if (data) topology.value = structuredClone(toRaw(data))
    },
    { immediate: true },
  )

  function patchVxc(productUid: string, patch: Partial<VXC>) {
    topology.value = {
      ...topology.value,
      vxcs: topology.value.vxcs.map((v) => (v.productUid === productUid ? { ...v, ...patch } : v)),
    }
  }

  // Drive a freshly-created VXC through DEPLOYABLE → CONFIGURED → LIVE so the
  // lifecycle is visible. In live mode this is server-driven, surfaced via refetch.
  function simulateProvisioning(productUid: string) {
    if (dataSourceLabel() !== 'mock') return
    for (const step of PROVISIONING_STEPS) {
      setTimeout(() => {
        patchVxc(productUid, { status: step.status })
        setMockVxcStatus(productUid, step.status)
      }, step.at)
    }
  }

  async function addVxc(input: CreateVxcInput) {
    busy.value = true
    notice.value = null
    try {
      const { productUid } = await createVxc(input)
      const vxc: VXC = {
        productUid: productUid || `vxc-${crypto.randomUUID().slice(0, 8)}`,
        productName: input.productName,
        type: 'VXC',
        status: 'DEPLOYABLE',
        rateLimit: input.rateLimit,
        aEndUid: input.aEndProductUid,
        bEndUid: input.bEndProductUid,
        vlan: input.aEndVlan,
      }
      topology.value = { ...topology.value, vxcs: [...topology.value.vxcs, vxc] }
      notice.value = { kind: 'ok', text: `Created “${input.productName}” — provisioning…` }
      simulateProvisioning(vxc.productUid)
    } catch (e) {
      notice.value = { kind: 'error', text: `Couldn't create VXC: ${(e as Error).message}` }
    } finally {
      busy.value = false
    }
  }

  async function editVxc(productUid: string, changes: UpdateVxcInput) {
    busy.value = true
    notice.value = null
    try {
      await updateVxc(productUid, changes)
      patchVxc(productUid, {
        ...(changes.name != null && { productName: changes.name }),
        ...(changes.rateLimit != null && { rateLimit: changes.rateLimit }),
        ...(changes.aEndVlan != null && { vlan: changes.aEndVlan }),
        // Admin shut-down is separate from lifecycle status — the VXC stays
        // LIVE/CONFIGURED, it's just administratively up or down.
        ...(changes.shutdown != null && { shutDown: changes.shutdown }),
      })
      notice.value = {
        kind: 'ok',
        text:
          changes.shutdown != null
            ? `${changes.shutdown ? 'Shut down' : 'Brought up'} VXC`
            : 'Updated VXC',
      }
    } catch (e) {
      notice.value = { kind: 'error', text: `Couldn't update VXC: ${(e as Error).message}` }
    } finally {
      busy.value = false
    }
  }

  return {
    topology,
    busy,
    notice,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    addVxc,
    editVxc,
  }
}
