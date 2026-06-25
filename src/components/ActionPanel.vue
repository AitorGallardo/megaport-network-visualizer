<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Topology, VXC } from '../types/megaport'
import type { CreateVxcInput, UpdateVxcInput } from '../api/megaportClient'
import type { Notice } from '../composables/useTopologyStore'

const props = defineProps<{
  topology: Topology
  selectedUid: string | null
  busy: boolean
  notice: Notice | null
}>()
const emit = defineEmits<{
  (e: 'create', input: CreateVxcInput): void
  (e: 'edit', uid: string, changes: UpdateVxcInput): void
}>()

// VXC endpoint rules (per docs.megaport.com):
//  • A-End must be a service you own and configure — a Port, MCR or MVE.
//    Cloud on-ramps are always a target, never a source.
//  • B-End can be any other node (Port/MCR/MVE) or a cloud on-ramp.
// This also prevents the illegal cloud→cloud case automatically.
const aEndOptions = computed(() => props.topology.nodes.filter((n) => n.type !== 'CLOUD'))
const bEndOptions = computed(() => props.topology.nodes.filter((n) => n.productUid !== aEnd.value))

// --- create form ---
const aEnd = ref('')
const bEnd = ref('')
const rate = ref(1000)
const name = ref('')
const vlan = ref<number | null>(null)
const canCreate = computed(() => aEnd.value && bEnd.value && aEnd.value !== bEnd.value && rate.value > 0)

function submitCreate() {
  if (!canCreate.value) return
  emit('create', {
    productName: name.value.trim() || 'New VXC',
    rateLimit: rate.value,
    aEndProductUid: aEnd.value,
    bEndProductUid: bEnd.value,
    aEndVlan: vlan.value ?? undefined,
  })
  name.value = ''
  vlan.value = null
}

// --- edit selected VXC ---
const selectedVxc = computed<VXC | null>(
  () => props.topology.vxcs.find((v) => v.productUid === props.selectedUid) ?? null,
)
const editRate = ref<number | null>(null)
function applyRate() {
  if (selectedVxc.value && editRate.value && editRate.value > 0) {
    emit('edit', selectedVxc.value.productUid, { rateLimit: editRate.value })
    editRate.value = null
  }
}
function toggleShutdown() {
  if (!selectedVxc.value) return
  emit('edit', selectedVxc.value.productUid, { shutdown: !selectedVxc.value.shutDown })
}
function nodeName(uid: string) {
  return props.topology.nodes.find((n) => n.productUid === uid)?.productName ?? uid
}
</script>

<template>
  <div class="rounded-card border border-rim bg-ember p-4">
    <div class="mb-3 flex items-baseline justify-between">
      <span class="text-[15px] font-medium text-parchment">Provision</span>
      <span v-if="busy" class="font-mono text-[11px] text-config">working…</span>
    </div>

    <!-- create -->
    <div class="mb-2.5 flex flex-col gap-1">
      <label class="lbl">A-End</label>
      <select v-model="aEnd" class="inp">
        <option value="" disabled>Select endpoint</option>
        <option v-for="n in aEndOptions" :key="n.productUid" :value="n.productUid">{{ n.productName }}</option>
      </select>
    </div>
    <div class="mb-2.5 flex flex-col gap-1">
      <label class="lbl">B-End</label>
      <select v-model="bEnd" class="inp">
        <option value="" disabled>Select endpoint</option>
        <option v-for="n in bEndOptions" :key="n.productUid" :value="n.productUid">{{ n.productName }}</option>
      </select>
    </div>
    <p class="-mt-0.5 mb-2.5 text-[11px] leading-snug text-copper">
      A-End is a Port, MCR or MVE you own. Cloud on-ramps are always the B-End.
    </p>
    <div class="mb-2.5 flex flex-col gap-1">
      <label class="lbl">Name</label>
      <input v-model="name" class="inp" placeholder="New VXC" />
    </div>
    <div class="flex gap-2">
      <div class="mb-2.5 flex flex-1 flex-col gap-1">
        <label class="lbl">Rate (Mbps)</label>
        <input v-model.number="rate" type="number" min="50" step="50" class="inp" />
      </div>
      <div class="mb-2.5 flex w-[110px] flex-col gap-1">
        <label class="lbl">VLAN</label>
        <input v-model.number="vlan" type="number" min="2" max="4093" class="inp" placeholder="auto" />
      </div>
    </div>
    <button class="btn-create" :disabled="!canCreate || busy" @click="submitCreate">Create VXC</button>

    <!-- edit selected VXC -->
    <div v-if="selectedVxc" class="mt-3.5 border-t border-rim pt-3">
      <div class="lbl">Selected VXC</div>
      <div class="mt-1 text-[13px] font-medium text-parchment">{{ selectedVxc.productName }}</div>
      <div class="mt-0.5 font-mono text-[11.5px] text-ash">
        {{ nodeName(selectedVxc.aEndUid) }} → {{ nodeName(selectedVxc.bEndUid) }} ·
        {{ selectedVxc.shutDown ? 'SHUT DOWN' : selectedVxc.status }}
      </div>
      <div class="mt-2 flex gap-2">
        <input
          v-model.number="editRate"
          type="number"
          min="50"
          step="50"
          class="inp"
          :placeholder="`${selectedVxc.rateLimit} Mbps`"
        />
        <button class="btn-mini" :disabled="busy || !editRate" @click="applyRate">Set rate</button>
      </div>
      <button
        class="btn-mini wide"
        :class="{ danger: !selectedVxc.shutDown }"
        :disabled="busy"
        @click="toggleShutdown"
      >
        {{ selectedVxc.shutDown ? 'Bring up' : 'Shut down' }}
      </button>
    </div>
    <div v-else class="mt-3 text-xs leading-relaxed text-copper">
      Tip: click a connection’s line (or a row in the inspector) to edit or shut it down.
    </div>

    <div
      v-if="notice"
      class="mt-3 font-mono text-[11.5px]"
      :class="notice.kind === 'error' ? 'text-mp' : 'text-live'"
    >
      {{ notice.kind === 'error' ? '⚠' : '✓' }} {{ notice.text }}
    </div>
  </div>
</template>

<style scoped>
.lbl {
  @apply font-mono text-[10.5px] uppercase tracking-label text-ash;
}
.inp {
  @apply w-full rounded-md border border-rim bg-canvas px-2.5 py-[7px] font-sans text-[13px] text-parchment;
}
.inp:focus {
  @apply border-copper outline-none;
}
.btn-create {
  @apply mt-1 w-full rounded-pill border border-canvas bg-parchment py-2.5 text-[13px] font-medium text-canvas transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-40;
}
.btn-mini {
  @apply cursor-pointer whitespace-nowrap rounded-md border border-rim bg-transparent px-3 py-[7px] text-[12.5px] text-parchment hover:border-copper disabled:cursor-default disabled:opacity-40;
}
.btn-mini.wide {
  @apply mt-2 w-full;
}
.btn-mini.danger {
  @apply text-[#f0a0a8];
  border-color: rgba(224, 24, 45, 0.5);
}
</style>
