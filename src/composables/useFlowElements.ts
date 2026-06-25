import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { MarkerType, type Edge, type Node } from '@vue-flow/core'
import type { Topology, NetworkNode } from '../types/megaport'
import { groupNodes } from '../domain/topology'
import { EDGE_DOWN, statusColor } from '../constants/theme'

// Convert our Topology into Vue Flow nodes + edges.
// Layered columns: Ports (left) → MCR/MVE (middle) → Cloud on-ramps (right),
// mirroring how traffic flows through a Megaport deployment.

const COL = { port: 40, router: 420, cloud: 800 }
const ROW_GAP = 132
const TOP = 40
const ASSUMED_ROWS = 3 // vertical-centre each column against a 3-row reference

// Edge thickness encodes committed bandwidth. sqrt keeps 1–10 Gbps legible
// instead of saturating the way a linear scale does.
const MIN_EDGE_PX = 1.5
const MAX_EDGE_PX = 5
function edgeWidth(rateMbps: number): number {
  return Math.min(MAX_EDGE_PX, Math.max(MIN_EDGE_PX, Math.sqrt(rateMbps / 1000) * 1.6))
}

export function useFlowElements(source: MaybeRefOrGetter<Topology | undefined>) {
  const nodes = computed<Node[]>(() => {
    const t = toValue(source)
    if (!t) return []
    const { ports, routers, clouds } = groupNodes(t)

    const build = (group: NetworkNode[], x: number): Node[] => {
      const totalH = (group.length - 1) * ROW_GAP
      const offset = TOP + Math.max(0, (ASSUMED_ROWS * ROW_GAP - totalH) / 2)
      return group.map((n, i) => ({
        id: n.productUid,
        type: 'mpNode',
        position: { x, y: offset + i * ROW_GAP },
        data: n,
        draggable: true,
      }))
    }
    return [
      ...build(ports, COL.port),
      ...build(routers, COL.router),
      ...build(clouds, COL.cloud),
    ]
  })

  const edges = computed<Edge[]>(() => {
    const t = toValue(source)
    if (!t) return []
    return t.vxcs.map((v) => {
      const down = !!v.shutDown
      const live = v.status === 'LIVE' && !down
      const stroke = down ? EDGE_DOWN : statusColor(v.status)
      return {
        id: v.productUid,
        source: v.aEndUid,
        target: v.bEndUid,
        type: 'traffic',
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        style: {
          stroke,
          strokeWidth: edgeWidth(v.rateLimit),
          strokeDasharray: live ? undefined : '6 5',
          opacity: down ? 0.5 : 1,
        },
        data: { live, down, rateLimit: v.rateLimit, status: v.status },
      }
    })
  })

  return { nodes, edges }
}
