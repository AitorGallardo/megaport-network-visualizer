import type { NetworkNode, Topology } from '../types/megaport'

// Pure domain helpers — a single home for the node classification and
// aggregation logic that several views need, so it can't drift between them.

export const isPort = (n: NetworkNode): boolean => n.type === 'PORT'
export const isRouter = (n: NetworkNode): boolean => n.type === 'MCR' || n.type === 'MVE'
export const isCloud = (n: NetworkNode): boolean => n.type === 'CLOUD'

/** Split nodes into the three layout columns: access ports, routing, cloud on-ramps. */
export function groupNodes(t: Topology): {
  ports: NetworkNode[]
  routers: NetworkNode[]
  clouds: NetworkNode[]
} {
  return {
    ports: t.nodes.filter(isPort),
    routers: t.nodes.filter(isRouter),
    clouds: t.nodes.filter(isCloud),
  }
}

/**
 * Committed access bandwidth (Mbps): only VXCs that terminate on a physical
 * Port count, so transit/cloud legs of the same flow aren't double-counted.
 * Shut-down VXCs are excluded.
 */
export function committedAccessMbps(t: Topology): number {
  const portIds = new Set(t.nodes.filter(isPort).map((n) => n.productUid))
  return t.vxcs
    .filter((v) => !v.shutDown && (portIds.has(v.aEndUid) || portIds.has(v.bEndUid)))
    .reduce((sum, v) => sum + v.rateLimit, 0)
}

/**
 * The set of product UIDs in the immediate neighbourhood of a selection —
 * used to focus the graph. If `uid` is a node, returns it plus its directly
 * connected nodes; if it's a VXC, returns both its endpoints.
 */
export function neighborhood(t: Topology, uid: string): Set<string> {
  const ids = new Set<string>()
  // keep the selected node lit (a selected VXC lights its endpoints instead)
  if (t.nodes.some((n) => n.productUid === uid)) ids.add(uid)
  for (const v of t.vxcs) {
    if (v.productUid === uid) {
      ids.add(v.aEndUid)
      ids.add(v.bEndUid)
    } else if (v.aEndUid === uid) {
      ids.add(v.bEndUid)
    } else if (v.bEndUid === uid) {
      ids.add(v.aEndUid)
    }
  }
  return ids
}
