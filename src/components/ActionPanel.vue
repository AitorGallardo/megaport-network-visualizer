<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Topology, VXC } from '../types/megaport'
import type { CreateVxcInput, UpdateVxcInput } from '../api/megaportClient'

const props = defineProps<{
  topology: Topology
  selectedUid: string | null
  busy: boolean
  lastAction: string | null
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
const aEndOptions = computed(() => props.topology.nodes.filter((n) => !n.provider))
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
  <div class="actions-card">
    <div class="ac-head">
      <span class="ac-title">Provision</span>
      <span v-if="busy" class="ac-busy">working…</span>
    </div>

    <!-- create -->
    <div class="field">
      <label>A-End</label>
      <select v-model="aEnd" class="inp">
        <option value="" disabled>Select endpoint</option>
        <option v-for="n in aEndOptions" :key="n.productUid" :value="n.productUid">{{ n.productName }}</option>
      </select>
    </div>
    <div class="field">
      <label>B-End</label>
      <select v-model="bEnd" class="inp">
        <option value="" disabled>Select endpoint</option>
        <option v-for="n in bEndOptions" :key="n.productUid" :value="n.productUid">{{ n.productName }}</option>
      </select>
    </div>
    <p class="rule">A-End is a Port, MCR or MVE you own. Cloud on-ramps are always the B-End.</p>
    <div class="field">
      <label>Name</label>
      <input v-model="name" class="inp" placeholder="New VXC" />
    </div>
    <div class="row">
      <div class="field grow">
        <label>Rate (Mbps)</label>
        <input v-model.number="rate" type="number" min="50" step="50" class="inp" />
      </div>
      <div class="field rate">
        <label>VLAN</label>
        <input v-model.number="vlan" type="number" min="2" max="4093" class="inp" placeholder="auto" />
      </div>
    </div>
    <button class="btn-create" :disabled="!canCreate || busy" @click="submitCreate">
      Create VXC
    </button>

    <!-- edit selected VXC -->
    <div v-if="selectedVxc" class="edit">
      <div class="edit-h">Selected VXC</div>
      <div class="edit-name">{{ selectedVxc.productName }}</div>
      <div class="edit-meta">
        {{ nodeName(selectedVxc.aEndUid) }} → {{ nodeName(selectedVxc.bEndUid) }} ·
        {{ selectedVxc.shutDown ? 'SHUT DOWN' : selectedVxc.status }}
      </div>
      <div class="row" style="margin-top:8px">
        <input v-model.number="editRate" type="number" min="50" step="50" class="inp" :placeholder="`${selectedVxc.rateLimit} Mbps`" />
        <button class="btn-mini" :disabled="busy || !editRate" @click="applyRate">Set rate</button>
      </div>
      <button class="btn-mini wide" :class="{ danger: !selectedVxc.shutDown }" :disabled="busy" @click="toggleShutdown">
        {{ selectedVxc.shutDown ? 'Bring up' : 'Shut down' }}
      </button>
    </div>
    <div v-else class="hint">Tip: click a connection’s line to edit or shut it down.</div>

    <div v-if="lastAction" class="last">✓ {{ lastAction }}</div>
  </div>
</template>

<style scoped>
.actions-card { background: #242424; border: 1px solid #3f403d; border-radius: 12px; padding: 16px; }
.ac-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 12px; }
.ac-title { color: #e9ebdf; font-size: 15px; font-weight: 500; }
.ac-busy { color: #e0a83a; font-family: 'Space Grotesk', monospace; font-size: 11px; }
.field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.field label { color: #94958e; font-family: 'Space Grotesk', monospace; font-size: 10.5px; letter-spacing: .03em; text-transform: uppercase; }
.inp {
  background: #151515; border: 1px solid #3f403d; border-radius: 6px; color: #e9ebdf;
  font-size: 13px; padding: 7px 9px; font-family: Inter, sans-serif; width: 100%;
}
.inp:focus { outline: none; border-color: #8b867f; }
.row { display: flex; gap: 8px; }
.rule { margin: -2px 0 10px; color: #8b867f; font-size: 11px; line-height: 1.4; }
.grow { flex: 1; }
.rate { width: 110px; }
.btn-create {
  width: 100%; margin-top: 4px; background: #e9ebdf; color: #151515; border: 1px solid #151515;
  border-radius: 9999px; padding: 9px; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: opacity .2s cubic-bezier(.72,0,.12,1);
}
.btn-create:hover { opacity: .88; }
.btn-create:disabled { opacity: .4; cursor: default; }
.edit { margin-top: 14px; border-top: 1px solid #3f403d; padding-top: 12px; }
.edit-h { color: #94958e; font-family: 'Space Grotesk', monospace; font-size: 10.5px; letter-spacing: .03em; text-transform: uppercase; }
.edit-name { color: #e9ebdf; font-size: 13px; font-weight: 500; margin-top: 4px; }
.edit-meta { color: #94958e; font-size: 11.5px; font-family: 'Space Grotesk', monospace; margin-top: 2px; }
.btn-mini {
  background: transparent; color: #e9ebdf; border: 1px solid #3f403d; border-radius: 6px;
  padding: 7px 12px; font-size: 12.5px; cursor: pointer; white-space: nowrap;
}
.btn-mini:hover { border-color: #8b867f; }
.btn-mini:disabled { opacity: .4; cursor: default; }
.btn-mini.wide { width: 100%; margin-top: 8px; }
.btn-mini.danger { border-color: rgba(224,24,45,.5); color: #f0a0a8; }
.hint { margin-top: 12px; color: #8b867f; font-size: 12px; line-height: 1.4; }
.last { margin-top: 12px; color: #5dcaa5; font-family: 'Space Grotesk', monospace; font-size: 11.5px; }
</style>
