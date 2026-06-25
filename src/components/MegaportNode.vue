<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import type { NetworkNode } from '../types/megaport'
import { NODE_ACCENT, PROVIDER_ACCENT, statusColor } from '../constants/theme'

const props = defineProps<{ data: NetworkNode; selected?: boolean }>()

const accent = computed(() => {
  if (props.data.provider) return PROVIDER_ACCENT[props.data.provider] ?? NODE_ACCENT.cloud
  if (props.data.type === 'CLOUD') return NODE_ACCENT.cloud
  if (props.data.type === 'PORT') return NODE_ACCENT.port
  return NODE_ACCENT.router
})
const kind = computed(() => props.data.provider ?? props.data.type)
const glyph = computed(() => {
  if (props.data.provider) return props.data.provider[0]
  return props.data.type === 'PORT' ? '⬡' : props.data.type === 'MCR' ? 'R' : props.data.type === 'MVE' ? 'E' : '☁'
})
</script>

<template>
  <div
    class="mpnode flex w-[210px] items-center gap-2.5 rounded-card border border-rim bg-ember px-3.5 py-3 font-sans"
    :class="{ sel: selected }"
    :style="{ '--accent': accent }"
  >
    <Handle type="target" :position="Position.Left" class="mp-handle" />
    <Handle type="source" :position="Position.Right" class="mp-handle" />

    <div
      class="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] border bg-void text-[15px] font-semibold"
      :style="{ color: accent, borderColor: accent }"
    >
      {{ glyph }}
    </div>
    <div class="min-w-0">
      <div class="truncate text-[13px] font-medium tracking-head text-parchment">{{ data.productName }}</div>
      <div class="mt-px font-mono text-[11px] tracking-label text-ash">
        <span class="uppercase">{{ kind }}</span>
        <span v-if="data.portSpeed">· {{ data.portSpeed / 1000 }}G</span>
      </div>
    </div>
    <span
      class="ml-auto h-2 w-2 flex-none rounded-full"
      :style="{ background: statusColor(data.status) }"
      :title="data.status"
    />
  </div>
</template>

<style scoped>
.mpnode {
  transition:
    border-color 0.2s cubic-bezier(0.72, 0, 0.12, 1),
    transform 0.2s cubic-bezier(0.72, 0, 0.12, 1),
    background 0.2s;
}
.mpnode:hover {
  border-color: var(--accent);
  background: #2c2c2c;
  transform: translateY(-1px);
}
.mpnode.sel {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
}
.mp-handle {
  width: 7px;
  height: 7px;
  background: #3f403d;
  border: none;
}
</style>
