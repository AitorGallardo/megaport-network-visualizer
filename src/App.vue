<script setup lang="ts">
import { ref } from 'vue'
import { useTopologyStore } from './composables/useTopologyStore'
import { dataSourceLabel, type CreateVxcInput, type UpdateVxcInput } from './api/megaportClient'
import TopologyGraph from './components/TopologyGraph.vue'
import NodeDetail from './components/NodeDetail.vue'
import SummaryBar from './components/SummaryBar.vue'
import ActionPanel from './components/ActionPanel.vue'
import GridDotBackground from './components/GridDotBackground.vue'

const {
  topology, busy, notice, isLoading, isError, error, refetch, isFetching, addVxc, editVxc,
} = useTopologyStore()

// selection can be a node OR a VXC (edge)
const selectedUid = ref<string | null>(null)
const source = dataSourceLabel()

function onCreate(input: CreateVxcInput) { addVxc(input) }
function onEdit(uid: string, changes: UpdateVxcInput) { editVxc(uid, changes) }
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-canvas">
    <GridDotBackground />

    <div class="relative mx-auto max-w-[1200px] px-7 pb-16 pt-[30px]">
      <!-- header -->
      <header class="mb-6 flex flex-wrap items-end justify-between gap-[18px]">
        <div>
          <div class="mb-2 font-mono text-xs uppercase tracking-label text-limestone">Network services</div>
          <h1 class="m-0 text-[44px] font-light leading-none tracking-display text-parchment">
            Network <span class="text-mp">Topology</span>
          </h1>
          <p class="mt-3 max-w-[620px] text-base leading-relaxed text-fog">
            Your Ports, VXCs, Cloud Routers and cloud on-ramps across every metro —
            one interactive view of the whole deployment.
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="rounded-tag border px-2.5 py-[5px] font-mono text-[11px] tracking-label"
            :class="source === 'live' ? 'border-forest bg-moss text-live' : 'border-rim text-ash'"
          >
            {{ source === 'live' ? 'LIVE · STAGING API' : 'MOCK DATA' }}
          </span>
          <button
            class="rounded-pill border border-canvas bg-parchment px-5 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-50"
            :disabled="isFetching"
            @click="() => refetch()"
          >
            {{ isFetching ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- loading -->
      <div
        v-if="isLoading"
        class="flex h-[360px] flex-col items-center justify-center gap-3 rounded-card border border-rim bg-ember text-sm text-ash"
      >
        <div class="h-[30px] w-[30px] animate-spin rounded-full border-2 border-rim border-t-mp"></div>
        <span>Loading topology…</span>
      </div>

      <!-- error -->
      <div
        v-else-if="isError"
        class="rounded-card border border-mp/40 bg-mp/[0.07] p-6 text-[#f0a0a8]"
      >
        <p class="m-0 font-medium text-parchment">Couldn't load topology.</p>
        <p class="mt-1.5 text-[13px]">{{ (error as Error)?.message }}</p>
        <button class="mt-2.5 border border-parchment px-4 py-[7px] text-sm text-parchment" @click="() => refetch()">
          Retry
        </button>
      </div>

      <!-- content -->
      <div v-else class="flex flex-col gap-4">
        <SummaryBar :topology="topology" />
        <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_330px]">
          <TopologyGraph
            :topology="topology"
            :selected-uid="selectedUid"
            @select="(u: string) => (selectedUid = u)"
          />
          <div class="flex flex-col gap-4">
            <NodeDetail
              :topology="topology"
              :uid="selectedUid"
              @select="(u: string) => (selectedUid = u)"
            />
            <ActionPanel
              :topology="topology"
              :selected-uid="selectedUid"
              :busy="busy"
              :notice="notice"
              @create="onCreate"
              @edit="onEdit"
            />
          </div>
        </div>
      </div>

      <footer class="mt-6 font-mono text-xs leading-relaxed text-copper">
        Live view of provisioned services · click a node to inspect its status, location and connections.
      </footer>
    </div>
  </div>
</template>
