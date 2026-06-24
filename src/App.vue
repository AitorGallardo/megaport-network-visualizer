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
  topology, busy, lastAction, isLoading, isError, error, refetch, isFetching, addVxc, editVxc,
} = useTopologyStore()

// selection can be a node OR a VXC (edge)
const selectedUid = ref<string | null>(null)
const source = dataSourceLabel()

function onCreate(input: CreateVxcInput) { addVxc(input) }
function onEdit(uid: string, changes: UpdateVxcInput) { editVxc(uid, changes) }
</script>

<template>
  <div class="page">
    <GridDotBackground />

    <div class="wrap">
      <!-- header -->
      <header class="head">
        <div>
          <div class="eyebrow">Network services</div>
          <h1 class="title">Network <span class="accent">Topology</span></h1>
          <p class="lede">
            Your Ports, VXCs, Cloud Routers and cloud on-ramps across every metro —
            one interactive view of the whole deployment.
          </p>
        </div>
        <div class="actions">
          <span class="src" :class="source === 'live' ? 'src-live' : 'src-mock'">
            {{ source === 'live' ? 'LIVE · STAGING API' : 'MOCK DATA' }}
          </span>
          <button class="btn-pill" :disabled="isFetching" @click="() => refetch()">
            {{ isFetching ? 'Refreshing…' : 'Refresh' }}
          </button>
        </div>
      </header>

      <!-- loading -->
      <div v-if="isLoading" class="state">
        <div class="spinner"></div>
        <span>Loading topology…</span>
      </div>

      <!-- error -->
      <div v-else-if="isError" class="state state-err">
        <p class="err-title">Couldn't load topology.</p>
        <p class="err-msg">{{ (error as Error)?.message }}</p>
        <button class="btn-ghost" @click="() => refetch()">Retry</button>
      </div>

      <!-- content -->
      <div v-else class="content">
        <SummaryBar :topology="topology" />
        <div class="layout">
          <TopologyGraph
            :topology="topology"
            :selected-uid="selectedUid"
            @select="(u: string) => selectedUid = u"
          />
          <div class="side">
            <NodeDetail :topology="topology" :uid="selectedUid" @select="(u: string) => selectedUid = u" />
            <ActionPanel
              :topology="topology"
              :selected-uid="selectedUid"
              :busy="busy"
              :last-action="lastAction"
              @create="onCreate"
              @edit="onEdit"
            />
          </div>
        </div>
      </div>

      <footer class="foot">
        Live view of provisioned services · click a node to inspect its status, location and connections.
      </footer>
    </div>
  </div>
</template>

<style scoped>
.page { position: relative; min-height: 100vh; background: #151515; overflow: hidden; }
.wrap { position: relative; max-width: 1200px; margin: 0 auto; padding: 30px 28px 64px; }

.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; flex-wrap: wrap; margin-bottom: 24px; }
.eyebrow { color: #b6b8af; font-family: 'Space Grotesk', monospace; font-size: 12px; letter-spacing: .04em; text-transform: uppercase; margin-bottom: 8px; }
.title { margin: 0; color: #e9ebdf; font-size: 44px; font-weight: 300; letter-spacing: -0.022em; line-height: 1; }
.accent { color: #E0182D; }
.lede { margin: 12px 0 0; max-width: 620px; color: #cbccc4; font-size: 16px; line-height: 1.5; font-weight: 380; }

.actions { display: flex; align-items: center; gap: 12px; }
.src { font-family: 'Space Grotesk', monospace; font-size: 11px; letter-spacing: .03em; padding: 5px 10px; border-radius: 4px; border: 1px solid #3f403d; }
.src-mock { color: #94958e; }
.src-live { color: #5dcaa5; border-color: #185849; background: #0e352c; }

.btn-pill {
  background: #e9ebdf; color: #151515; border: 1px solid #151515; border-radius: 9999px;
  padding: 8px 20px; font-size: 14px; font-weight: 500; cursor: pointer;
  transition: opacity .2s cubic-bezier(.72,0,.12,1);
}
.btn-pill:hover { opacity: .88; }
.btn-pill:disabled { opacity: .5; cursor: default; }
.btn-ghost { background: transparent; color: #e9ebdf; border: 1px solid #e9ebdf; border-radius: 0; padding: 7px 16px; font-size: 14px; cursor: pointer; margin-top: 10px; }

.state {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  height: 360px; background: #242424; border: 1px solid #3f403d; border-radius: 12px; color: #94958e; font-size: 14px;
}
.spinner { width: 30px; height: 30px; border: 2px solid #3f403d; border-top-color: #E0182D; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.state-err { border-color: rgba(224,24,45,.4); background: rgba(224,24,45,.07); color: #f0a0a8; }
.err-title { font-weight: 500; color: #e9ebdf; margin: 0; }
.err-msg { margin: 6px 0 0; font-size: 13px; }

.content { display: flex; flex-direction: column; gap: 16px; }
.layout { display: grid; grid-template-columns: 1fr 330px; gap: 16px; align-items: start; }
@media (max-width: 920px) { .layout { grid-template-columns: 1fr; } }
.side { display: flex; flex-direction: column; gap: 16px; }

.foot { margin-top: 24px; color: #8b867f; font-family: 'Space Grotesk', monospace; font-size: 12px; letter-spacing: .01em; line-height: 1.6; }
</style>
