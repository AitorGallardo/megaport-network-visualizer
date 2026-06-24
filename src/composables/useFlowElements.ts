import { computed, type Ref } from 'vue'
import { MarkerType, type Edge, type Node } from '@vue-flow/core'
import type { Topology, NetworkNode } from '../types/megaport'

// Convert our Topology into Vue Flow nodes + edges.
// Layered columns: Ports (left) → MCR/MVE (middle) → Cloud on-ramps (right),
// mirroring how traffic flows through a Megaport deployment.

const COL = { port: 40, router: 420, cloud: 800 }
const ROW_GAP = 132
const TOP = 40

const statusStroke: Record<string, string> = {
  LIVE: '#5dcaa5',
  CONFIGURED: '#e0a83a',
  DEPLOYABLE: '#6aa8e0',
  DECOMMISSIONED: '#8b867f',
  CANCELLED: '#E0182D',
}

export function useFlowElements(topology: Ref<Topology | undefined>) {
  const nodes = computed<Node[]>(() => {
    const t = topology.value
    if (!t) return []
    const ports = t.nodes.filter((n) => n.type === 'PORT' && !n.provider)
    const routers = t.nodes.filter((n) => (n.type === 'MCR' || n.type === 'MVE') && !n.provider)
    const clouds = t.nodes.filter((n) => !!n.provider)

    const build = (group: NetworkNode[], x: number): Node[] => {
      const totalH = (group.length - 1) * ROW_GAP
      const offset = TOP + Math.max(0, (3 * ROW_GAP - totalH) / 2)
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
    const t = topology.value
    if (!t) return []
    return t.vxcs.map((v) => {
      const down = !!v.shutDown
      const stroke = down ? '#6b6b6b' : (statusStroke[v.status] ?? '#8b867f')
      const animated = v.status === 'LIVE' && !down
      return {
        id: v.productUid,
        source: v.aEndUid,
        target: v.bEndUid,
        animated,
        label: down ? `${v.rateLimit} Mbps · shut down` : `${v.rateLimit} Mbps`,
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, color: stroke, width: 16, height: 16 },
        style: {
          stroke,
          strokeWidth: Math.max(1.5, Math.min(5, v.rateLimit / 1500)),
          strokeDasharray: animated ? undefined : '6 5',
          opacity: down ? 0.45 : 1,
        },
        labelStyle: { fill: '#cbccc4', fontSize: '11px', fontFamily: 'Space Grotesk, monospace' },
        labelBgStyle: { fill: '#0e0e0e', fillOpacity: 0.85 },
        labelBgPadding: [4, 3] as [number, number],
        labelBgBorderRadius: 4,
      }
    })
  })

  return { nodes, edges }
}
