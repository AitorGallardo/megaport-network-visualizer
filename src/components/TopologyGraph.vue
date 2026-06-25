<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import { VueFlow, useVueFlow, type EdgeTypesObject, type NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Topology } from '../types/megaport'
import { useFlowElements } from '../composables/useFlowElements'
import { useTraffic } from '../composables/useTraffic'
import { neighborhood } from '../domain/topology'
import MegaportNode from './MegaportNode.vue'
import TrafficEdge from './TrafficEdge.vue'

const props = defineProps<{ topology: Topology; selectedUid: string | null }>()
const emit = defineEmits<{ (e: 'select', uid: string): void }>()

const { nodes, edges } = useFlowElements(() => props.topology)
const { utilization } = useTraffic(() => props.topology)

const nodeTypes = { mpNode: markRaw(MegaportNode) } as NodeTypesObject
const edgeTypes = { traffic: markRaw(TrafficEdge) } as EdgeTypesObject

const { fitView, onNodeClick, onEdgeClick } = useVueFlow()
onNodeClick(({ node }) => emit('select', node.id))
onEdgeClick(({ edge }) => emit('select', edge.id))

// Focus mode: when something is selected, dim everything outside its neighbourhood.
const focusIds = computed(() =>
  props.selectedUid ? neighborhood(props.topology, props.selectedUid) : null,
)

const flowNodes = computed(() =>
  nodes.value.map((n) => {
    const dim = focusIds.value ? !focusIds.value.has(n.id) : false
    return {
      ...n,
      selected: n.id === props.selectedUid,
      style: { opacity: dim ? 0.22 : 1, transition: 'opacity .3s ease' },
    }
  }),
)

const flowEdges = computed(() =>
  edges.value.map((e) => {
    const active =
      !focusIds.value ||
      e.id === props.selectedUid ||
      (focusIds.value.has(e.source) && focusIds.value.has(e.target))
    const dimmed = !active
    const baseOpacity = e.data?.down ? 0.5 : 1
    return {
      ...e,
      data: { ...e.data, utilization: utilization.value[e.id] ?? 0, dimmed },
      style: { ...e.style, opacity: dimmed ? 0.12 : baseOpacity },
    }
  }),
)

const ready = ref(false)
watch(
  () => nodes.value.length,
  (len) => {
    if (len && !ready.value) {
      ready.value = true
      requestAnimationFrame(() => fitView({ padding: 0.15, duration: 400 }))
    }
  },
)

const legend = [
  { label: 'Live', token: 'bg-live' },
  { label: 'Configured', token: 'bg-config' },
  { label: 'Deployable', token: 'bg-deploy' },
]
</script>

<template>
  <div class="relative h-[624px] overflow-hidden rounded-card border border-rim bg-canvas">
    <VueFlow
      :nodes="flowNodes"
      :edges="flowEdges"
      :node-types="nodeTypes"
      :edge-types="edgeTypes"
      :min-zoom="0.4"
      :max-zoom="1.6"
      fit-view-on-init
      class="mpflow"
    >
      <Background pattern-color="#2a2a2a" :gap="22" :size="1" />
      <Controls position="bottom-left" />
    </VueFlow>

    <div
      class="pointer-events-none absolute right-3 top-3 z-10 flex flex-col gap-1.5 rounded-card border border-rim bg-canvas/80 px-3 py-2.5 font-mono backdrop-blur-sm"
    >
      <div v-for="s in legend" :key="s.label" class="flex items-center gap-2">
        <span class="h-[3px] w-[18px] rounded-sm" :class="s.token"></span>
        <span class="text-[11px] text-fog">{{ s.label }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="lg-down h-[3px] w-[18px] rounded-sm"></span>
        <span class="text-[11px] text-fog">Shut down</span>
      </div>
      <div class="mt-0.5 flex items-center gap-2">
        <span class="h-2 w-2 rounded-full bg-live"></span>
        <span class="text-[11px] text-fog">Flowing packets = live traffic</span>
      </div>
      <div class="mt-px max-w-[150px] text-[10px] leading-snug text-copper">
        Line thickness = committed bandwidth
      </div>
    </div>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.mpflow {
  background: #151515;
}
.mpflow .vue-flow__edge-path {
  stroke-linecap: round;
}
.mpflow .vue-flow__controls {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: none;
}
.mpflow .vue-flow__controls-button {
  background: #242424;
  border-bottom: 1px solid #3f403d;
  fill: #cbccc4;
}
.mpflow .vue-flow__controls-button:hover {
  background: #2c2c2c;
}

/* dashed dim swatch for the shut-down legend row */
.lg-down {
  background: repeating-linear-gradient(90deg, #6b6b6b 0 5px, transparent 5px 9px);
  opacity: 0.8;
}
</style>
