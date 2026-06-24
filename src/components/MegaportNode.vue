<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NetworkNode } from '../types/megaport'

const props = defineProps<{ data: NetworkNode; selected?: boolean }>()

const isCloud = computed(() => !!props.data.provider)
const kind = computed(() => props.data.provider ?? props.data.type)

const accent = computed(() => {
  if (isCloud.value) return '#6aa8e0'      // cloud = steel blue
  if (props.data.type === 'PORT') return '#8b867f' // port = copper
  return '#E0182D'                          // MCR/MVE = Megaport red
})
const glyph = computed(() => {
  if (props.data.provider) return props.data.provider[0]
  return props.data.type === 'PORT' ? '⬡' : props.data.type === 'MCR' ? 'R' : 'E'
})
const statusColor: Record<string, string> = {
  LIVE: '#5dcaa5', CONFIGURED: '#e0a83a', DEPLOYABLE: '#6aa8e0',
  DECOMMISSIONED: '#8b867f', CANCELLED: '#E0182D',
}
</script>

<template>
  <div
    class="mpnode"
    :class="{ sel: selected }"
    :style="{ '--accent': accent }"
  >
    <Handle type="target" :position="Position.Left" class="mp-handle" />
    <Handle type="source" :position="Position.Right" class="mp-handle" />

    <div class="glyph" :style="{ color: accent, borderColor: accent }">{{ glyph }}</div>
    <div class="meta">
      <div class="name">{{ data.productName }}</div>
      <div class="sub">
        <span class="kind">{{ kind }}</span>
        <span v-if="data.portSpeed" class="speed">· {{ data.portSpeed / 1000 }}G</span>
      </div>
    </div>
    <span class="dot" :style="{ background: statusColor[data.status] || '#8b867f' }" :title="data.status" />
  </div>
</template>

<style scoped>
.mpnode {
  display: flex; align-items: center; gap: 10px;
  width: 210px; padding: 11px 13px;
  background: #242424; border: 1px solid #3f403d; border-radius: 12px;
  transition: border-color .2s cubic-bezier(.72,0,.12,1), transform .2s cubic-bezier(.72,0,.12,1), background .2s;
  font-family: Inter, system-ui, sans-serif;
}
.mpnode:hover { background: #2c2c2c; border-color: var(--accent); transform: translateY(-1px); }
.mpnode.sel { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
.glyph {
  flex: none; width: 34px; height: 34px; border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 600; background: #0e0e0e; border: 1px solid;
}
.meta { min-width: 0; }
.name { color: #e9ebdf; font-size: 13px; font-weight: 500; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sub { color: #94958e; font-size: 11px; font-family: 'Space Grotesk', monospace; letter-spacing: .012em; margin-top: 1px; }
.kind { text-transform: uppercase; }
.dot { flex: none; width: 8px; height: 8px; border-radius: 50%; margin-left: auto; }
.mp-handle { width: 7px; height: 7px; background: #3f403d; border: none; }
</style>
