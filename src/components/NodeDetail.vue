<script setup lang="ts">
import { computed } from 'vue'
import type { Topology } from '../types/megaport'

const props = defineProps<{ topology: Topology | undefined; uid: string | null }>()
defineEmits<{ (e: 'select', uid: string): void }>()

const node = computed(() => props.topology?.nodes.find((n) => n.productUid === props.uid) ?? null)
const connections = computed(() => {
  const t = props.topology
  if (!t || !props.uid) return []
  return t.vxcs.filter((v) => v.aEndUid === props.uid || v.bEndUid === props.uid)
})
</script>

<template>
  <aside class="panel">
    <template v-if="node">
      <div class="phead">
        <h3 class="pname">{{ node.productName }}</h3>
        <span class="ptag">{{ node.provider ?? node.type }}</span>
      </div>
      <dl class="rows">
        <dt>Status</dt><dd>{{ node.status }}</dd>
        <dt>Location</dt><dd>{{ node.location.name }}</dd>
        <dt>Metro</dt><dd>{{ node.location.metro }}, {{ node.location.country }}</dd>
        <template v-if="node.portSpeed"><dt>Speed</dt><dd>{{ node.portSpeed / 1000 }} Gbps</dd></template>
        <dt>UID</dt><dd class="mono">{{ node.productUid }}</dd>
      </dl>
      <div class="conn">
        <div class="conn-h">Connections ({{ connections.length }})</div>
        <ul>
          <li
            v-for="c in connections"
            :key="c.productUid"
            class="conn-row"
            role="button"
            tabindex="0"
            @click="$emit('select', c.productUid)"
            @keydown.enter="$emit('select', c.productUid)"
          >
            <span class="cn">
              {{ c.productName }}
              <span v-if="c.shutDown" class="cdown">shut down</span>
            </span>
            <span class="cr">{{ c.rateLimit }} Mbps</span>
          </li>
        </ul>
        <div class="conn-tip">Select a connection to edit its rate or shut it down.</div>
      </div>
    </template>
    <div v-else class="empty">
      Click any node in the graph to inspect its status, location, and VXCs.
    </div>
  </aside>
</template>

<style scoped>
.panel { background: #242424; border: 1px solid #3f403d; border-radius: 12px; padding: 18px; min-height: 200px; }
.phead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.pname { margin: 0; color: #e9ebdf; font-size: 16px; font-weight: 500; letter-spacing: -0.01em; }
.ptag { color: #b6b8af; font-family: 'Space Grotesk', monospace; font-size: 11px; border: 1px solid #3f403d; border-radius: 4px; padding: 2px 7px; text-transform: uppercase; }
.rows { display: grid; grid-template-columns: auto 1fr; gap: 8px 14px; margin: 16px 0 0; font-size: 13px; }
.rows dt { color: #94958e; }
.rows dd { margin: 0; color: #e9ebdf; text-align: right; }
.mono { font-family: 'Space Grotesk', monospace; font-size: 11px; color: #8b867f; overflow: hidden; text-overflow: ellipsis; }
.conn { margin-top: 16px; border-top: 1px solid #3f403d; padding-top: 14px; }
.conn-h { color: #94958e; font-family: 'Space Grotesk', monospace; font-size: 11px; letter-spacing: .03em; text-transform: uppercase; margin-bottom: 8px; }
.conn ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 4px; }
.conn li { display: flex; justify-content: space-between; gap: 10px; font-size: 13px; }
.conn-row {
  cursor: pointer; padding: 5px 7px; margin: 0 -7px; border-radius: 6px;
  border: 1px solid transparent; transition: background .15s, border-color .15s;
}
.conn-row:hover, .conn-row:focus-visible { background: #2c2c2c; border-color: #3f403d; outline: none; }
.cn { color: #e9ebdf; }
.cdown { color: #8b867f; font-family: 'Space Grotesk', monospace; font-size: 10.5px; text-transform: uppercase; letter-spacing: .03em; margin-left: 6px; }
.cr { color: #94958e; font-family: 'Space Grotesk', monospace; }
.conn-tip { margin-top: 10px; color: #8b867f; font-size: 11.5px; }
.empty { display: flex; height: 160px; align-items: center; justify-content: center; text-align: center; color: #94958e; font-size: 14px; line-height: 1.5; }
</style>
