<script setup lang="ts">
import { computed } from 'vue'
import type { Topology } from '../types/megaport'
import { statusColor } from '../constants/theme'

const props = defineProps<{ topology: Topology; uid: string | null }>()
defineEmits<{ (e: 'select', uid: string): void }>()

const node = computed(() => props.topology.nodes.find((n) => n.productUid === props.uid) ?? null)
const connections = computed(() => {
  if (!props.uid) return []
  return props.topology.vxcs.filter((v) => v.aEndUid === props.uid || v.bEndUid === props.uid)
})
</script>

<template>
  <aside class="min-h-[200px] rounded-card border border-rim bg-ember p-[18px]">
    <template v-if="node">
      <div class="flex items-center justify-between gap-2">
        <h3 class="m-0 text-base font-medium tracking-head text-parchment">{{ node.productName }}</h3>
        <span class="rounded-tag border border-rim px-[7px] py-0.5 font-mono text-[11px] uppercase text-limestone">
          {{ node.provider ?? node.type }}
        </span>
      </div>
      <dl class="mt-4 grid grid-cols-[auto_1fr] gap-x-3.5 gap-y-2 text-[13px]">
        <dt class="text-ash">Status</dt>
        <dd class="m-0 text-right text-parchment">{{ node.status }}</dd>
        <dt class="text-ash">Location</dt>
        <dd class="m-0 text-right text-parchment">{{ node.location.name }}</dd>
        <dt class="text-ash">Metro</dt>
        <dd class="m-0 text-right text-parchment">{{ node.location.metro }}, {{ node.location.country }}</dd>
        <template v-if="node.portSpeed">
          <dt class="text-ash">Speed</dt>
          <dd class="m-0 text-right text-parchment">{{ node.portSpeed / 1000 }} Gbps</dd>
        </template>
        <dt class="text-ash">UID</dt>
        <dd class="m-0 truncate text-right font-mono text-[11px] text-copper">{{ node.productUid }}</dd>
      </dl>
      <div class="mt-4 border-t border-rim pt-3.5">
        <div class="mb-2 font-mono text-[11px] uppercase tracking-label text-ash">
          Connections ({{ connections.length }})
        </div>
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          <li
            v-for="c in connections"
            :key="c.productUid"
            class="-mx-[7px] flex cursor-pointer items-center justify-between gap-2.5 rounded-md border border-transparent px-[7px] py-[5px] text-[13px] transition-colors hover:border-rim hover:bg-ember2 focus-visible:border-rim focus-visible:bg-ember2 focus-visible:outline-none"
            role="button"
            tabindex="0"
            @click="$emit('select', c.productUid)"
            @keydown.enter="$emit('select', c.productUid)"
          >
            <span class="flex items-center gap-2 text-parchment">
              <span
                class="h-1.5 w-1.5 flex-none rounded-full"
                :style="{ background: c.shutDown ? '#6b6b6b' : statusColor(c.status) }"
              />
              {{ c.productName }}
              <span v-if="c.shutDown" class="font-mono text-[10.5px] uppercase tracking-label text-copper">
                shut down
              </span>
            </span>
            <span class="font-mono text-ash">{{ c.rateLimit }} Mbps</span>
          </li>
        </ul>
        <div class="mt-2.5 text-[11.5px] text-copper">Select a connection to edit its rate or shut it down.</div>
      </div>
    </template>
    <div v-else class="flex h-40 items-center justify-center text-center text-sm leading-relaxed text-ash">
      Click any node in the graph to inspect its status, location, and VXCs.
    </div>
  </aside>
</template>
