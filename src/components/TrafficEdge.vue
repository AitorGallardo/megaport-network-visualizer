<script setup lang="ts">
import { computed } from 'vue'
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, Position } from '@vue-flow/core'
import { utilizationColor } from '../constants/theme'

// Custom Vue Flow edge: the static circuit plus animated "packets" whose speed
// and colour track live utilisation. LIVE links flow; everything else is static.
interface EdgeData {
  live?: boolean
  down?: boolean
  rateLimit?: number
  utilization?: number
  dimmed?: boolean
}

const props = defineProps<{
  id: string
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
  sourcePosition: Position
  targetPosition: Position
  markerEnd?: string
  style?: Record<string, unknown>
  data?: EdgeData
}>()

const path = computed(() =>
  getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    borderRadius: 10,
  }),
)
const d = computed(() => path.value[0])
const labelX = computed(() => path.value[1])
const labelY = computed(() => path.value[2])

const util = computed(() => props.data?.utilization ?? 0)
const flowing = computed(() => !!props.data?.live && !props.data?.down)
const dimmed = computed(() => !!props.data?.dimmed)

// busier links = faster dots + more of them
const durSeconds = computed(() => 3.4 - util.value * 2.4)
const packets = computed(() => {
  if (!flowing.value) return []
  const count = Math.min(3, Math.max(1, Math.round(util.value * 3)))
  return Array.from({ length: count }, (_, i) => `${((i / count) * durSeconds.value).toFixed(2)}s`)
})
const packetColor = computed(() => utilizationColor(util.value))

const labelText = computed(() => {
  const r = props.data?.rateLimit ?? 0
  if (props.data?.down) return `${r} Mbps · shut down`
  if (flowing.value) return `${r} Mbps · ${Math.round(util.value * 100)}%`
  return `${r} Mbps`
})
</script>

<template>
  <BaseEdge :id="id" :path="d" :marker-end="markerEnd" :style="style" :interaction-width="22" />

  <circle
    v-for="(begin, i) in packets"
    :key="i"
    :r="3"
    :fill="packetColor"
    :opacity="dimmed ? 0.12 : 0.95"
  >
    <animateMotion :dur="`${durSeconds.toFixed(2)}s`" :begin="begin" repeatCount="indefinite" :path="d" />
  </circle>

  <EdgeLabelRenderer>
    <div
      class="nodrag nopan pointer-events-none absolute whitespace-nowrap rounded-tag bg-void/85 px-1.5 py-0.5 font-mono text-[10px] text-fog"
      :style="{
        transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)`,
        opacity: dimmed ? 0.25 : 1,
      }"
    >
      {{ labelText }}
    </div>
  </EdgeLabelRenderer>
</template>
