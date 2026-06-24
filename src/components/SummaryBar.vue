<script setup lang="ts">
import { computed } from 'vue'
import type { Topology } from '../types/megaport'

const props = defineProps<{ topology: Topology | undefined }>()

const stats = computed(() => {
  const t = props.topology
  if (!t) return []
  const ports = t.nodes.filter((n) => n.type === 'PORT' && !n.provider).length
  const routers = t.nodes.filter((n) => (n.type === 'MCR' || n.type === 'MVE') && !n.provider).length
  const clouds = t.nodes.filter((n) => !!n.provider).length
  const totalMbps = t.vxcs.reduce((s, v) => s + v.rateLimit, 0)
  return [
    { label: 'Ports', value: String(ports) },
    { label: 'Routers / Edges', value: String(routers) },
    { label: 'VXCs', value: String(t.vxcs.length) },
    { label: 'Cloud on-ramps', value: String(clouds) },
    { label: 'Committed', value: `${(totalMbps / 1000).toFixed(1)} Gbps` },
  ]
})
</script>

<template>
  <div class="bar">
    <div v-for="s in stats" :key="s.label" class="stat">
      <div class="val">{{ s.value }}</div>
      <div class="lab">{{ s.label }}</div>
    </div>
  </div>
</template>

<style scoped>
.bar { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
@media (max-width: 720px) { .bar { grid-template-columns: repeat(2, 1fr); } }
.stat { background: #242424; border: 1px solid #3f403d; border-radius: 12px; padding: 14px 16px; }
.val { color: #e9ebdf; font-size: 24px; font-weight: 380; letter-spacing: -0.024em; }
.lab { color: #94958e; font-family: 'Space Grotesk', monospace; font-size: 11px; letter-spacing: .03em; text-transform: uppercase; margin-top: 3px; }
</style>
