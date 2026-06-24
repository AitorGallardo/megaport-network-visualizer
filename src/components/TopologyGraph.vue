<script setup lang="ts">
import { computed, markRaw, ref, watch, type Ref } from 'vue'
import { VueFlow, useVueFlow, type NodeTypesObject } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import type { Topology } from '../types/megaport'
import { useFlowElements } from '../composables/useFlowElements'
import MegaportNode from './MegaportNode.vue'

const props = defineProps<{ topology: Topology | undefined; selectedUid: string | null }>()
const emit = defineEmits<{ (e: 'select', uid: string): void }>()

const topoRef = computed(() => props.topology) as Ref<Topology | undefined>
const { nodes, edges } = useFlowElements(topoRef)

const nodeTypes = { mpNode: markRaw(MegaportNode) } as unknown as NodeTypesObject
const { fitView, onNodeClick, onEdgeClick } = useVueFlow()

onNodeClick(({ node }) => emit('select', node.id))
onEdgeClick(({ edge }) => emit('select', edge.id))

const flowNodes = computed(() =>
  nodes.value.map((n) => ({ ...n, selected: n.id === props.selectedUid })),
)

const ready = ref(false)
watch(() => nodes.value.length, (len) => {
  if (len && !ready.value) {
    ready.value = true
    requestAnimationFrame(() => fitView({ padding: 0.15, duration: 400 }))
  }
})

// Legend: edge colour encodes provisioning status; thickness encodes bandwidth.
const legend = [
  { label: 'Live', color: '#5dcaa5' },
  { label: 'Configured', color: '#e0a83a' },
  { label: 'Deployable', color: '#6aa8e0' },
]
</script>

<template>
  <div class="graph-shell">
    <VueFlow
      :nodes="flowNodes"
      :edges="edges"
      :node-types="nodeTypes"
      :min-zoom="0.4"
      :max-zoom="1.6"
      fit-view-on-init
      class="mpflow"
    >
      <Background pattern-color="#2a2a2a" :gap="22" :size="1" />
      <Controls position="bottom-left" />
    </VueFlow>

    <div class="legend">
      <div v-for="s in legend" :key="s.label" class="lg-row">
        <span class="lg-line" :style="{ background: s.color }"></span>
        <span class="lg-lab">{{ s.label }}</span>
      </div>
      <div class="lg-row">
        <span class="lg-line lg-down"></span>
        <span class="lg-lab">Shut down</span>
      </div>
      <div class="lg-note">Line thickness = committed bandwidth</div>
    </div>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';

.graph-shell {
  position: relative;
  height: 624px; border: 1px solid #3f403d; border-radius: 12px; overflow: hidden;
  background: #151515;
}
.mpflow { background: #151515; }

.legend {
  position: absolute; top: 12px; right: 12px; z-index: 5; pointer-events: none;
  background: rgba(20,20,20,.82); backdrop-filter: blur(4px);
  border: 1px solid #3f403d; border-radius: 8px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 6px;
  font-family: 'Space Grotesk', monospace;
}
.lg-row { display: flex; align-items: center; gap: 8px; }
.lg-line { width: 18px; height: 3px; border-radius: 2px; flex: none; }
.lg-down { background: repeating-linear-gradient(90deg, #6b6b6b 0 5px, transparent 5px 9px); opacity: .8; }
.lg-lab { color: #cbccc4; font-size: 11px; }
.lg-note { color: #8b867f; font-size: 10px; margin-top: 2px; max-width: 150px; line-height: 1.3; }

.mpflow .vue-flow__edge-path { stroke-linecap: round; }
.mpflow .vue-flow__edge.animated .vue-flow__edge-path {
  stroke-dasharray: 6 4; animation: dashmove 0.7s linear infinite;
}
@keyframes dashmove { to { stroke-dashoffset: -20; } }

.mpflow .vue-flow__controls { border-radius: 8px; overflow: hidden; box-shadow: none; }
.mpflow .vue-flow__controls-button {
  background: #242424; border-bottom: 1px solid #3f403d; fill: #cbccc4;
}
.mpflow .vue-flow__controls-button:hover { background: #2c2c2c; }
.mpflow .vue-flow__edge-text { fill: #cbccc4; }
</style>
