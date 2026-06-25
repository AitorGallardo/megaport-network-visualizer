<script setup lang="ts">
import { computed } from 'vue'
import type { Topology } from '../types/megaport'
import { committedAccessMbps, groupNodes } from '../domain/topology'

const props = defineProps<{ topology: Topology }>()

const stats = computed(() => {
  const t = props.topology
  const { ports, routers, clouds } = groupNodes(t)
  return [
    { label: 'Ports', value: String(ports.length) },
    { label: 'Routers / Edges', value: String(routers.length) },
    { label: 'VXCs', value: String(t.vxcs.length) },
    { label: 'Cloud on-ramps', value: String(clouds.length) },
    { label: 'Committed access', value: `${(committedAccessMbps(t) / 1000).toFixed(1)} Gbps` },
  ]
})
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
    <div
      v-for="s in stats"
      :key="s.label"
      class="rounded-card border border-rim bg-ember px-4 py-3.5"
    >
      <div class="text-2xl tracking-display text-parchment">{{ s.value }}</div>
      <div class="mt-0.5 font-mono text-[11px] uppercase tracking-label text-ash">{{ s.label }}</div>
    </div>
  </div>
</template>
