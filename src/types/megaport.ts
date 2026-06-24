// Domain model for Megaport services, using Megaport's real vocabulary.
// Ref: docs.megaport.com — Ports, Connections (VXCs), Megaport Cloud Router (MCR),
// Megaport Virtual Edge (MVE), Cloud Connectivity.

export type ProvisioningStatus =
  | 'LIVE'
  | 'CONFIGURED'
  | 'DEPLOYABLE'
  | 'DECOMMISSIONED'
  | 'CANCELLED'

export type ServiceType = 'PORT' | 'MCR' | 'MVE' | 'VXC' | 'CLOUD'

/** A cloud on-ramp target for a VXC. */
export type CloudProvider = 'AWS' | 'AZURE' | 'GOOGLE' | 'ORACLE' | 'IBM' | null

export interface Location {
  id: number
  name: string // e.g. "Equinix SY3"
  metro: string // e.g. "Sydney"
  country: string // e.g. "Australia"
}

/**
 * A Port, MCR, MVE, or a cloud on-ramp — the "devices" a VXC connects.
 * `CLOUD` nodes are a visualization construct for a VXC's cloud B-End
 * (AWS/Azure/Google/…); they're always a target, never a VXC source.
 */
export interface NetworkNode {
  productUid: string
  productName: string
  type: Exclude<ServiceType, 'VXC'>
  status: ProvisioningStatus
  /** Aggregate port/router speed in Mbps. */
  portSpeed: number
  location: Location
  /** Cloud provider this node fronts, if it's a cloud on-ramp. */
  provider?: CloudProvider
}

/** A Virtual Cross Connect: a private L2 link between two nodes (or node→cloud). */
export interface VXC {
  productUid: string
  productName: string
  type: 'VXC'
  status: ProvisioningStatus
  /** Committed rate in Mbps. */
  rateLimit: number
  aEndUid: string // productUid of the A-End node
  bEndUid: string // productUid of the B-End node (or a cloud on-ramp)
  /** Set when the B-End is a cloud provider on-ramp. */
  cloud?: CloudProvider
  vlan?: number
  /**
   * Administrative shut-down. Distinct from `status`: a VXC can be LIVE but
   * administratively down (traffic stopped) without being decommissioned.
   * Mirrors Megaport's `shutDown` flag on PUT /v3/product/vxc/{uid}.
   */
  shutDown?: boolean
}

export interface Topology {
  nodes: NetworkNode[]
  vxcs: VXC[]
}
