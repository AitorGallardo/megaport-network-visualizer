import type { ProvisioningStatus, CloudProvider } from '../types/megaport'

// Single source of truth for data-driven colours used in JS (Vue Flow edge
// strokes, node dots, traffic dots). The same hex values are mirrored as
// Tailwind tokens in tailwind.config.js for utility-class styling in templates.

export const STATUS_COLOR: Record<ProvisioningStatus, string> = {
  LIVE: '#5dcaa5',
  CONFIGURED: '#e0a83a',
  DEPLOYABLE: '#6aa8e0',
  DECOMMISSIONED: '#8b867f',
  CANCELLED: '#E0182D',
}

/** Stroke colour for an administratively shut-down VXC. */
export const EDGE_DOWN = '#6b6b6b'

/** Fallback when a status is unknown. */
export const UNKNOWN_COLOR = '#8b867f'

/** Accent colours per node role (cloud = steel blue, port = copper, router = brand red). */
export const NODE_ACCENT = {
  cloud: '#6aa8e0',
  port: '#8b867f',
  router: '#E0182D',
} as const

export function statusColor(status: ProvisioningStatus): string {
  return STATUS_COLOR[status] ?? UNKNOWN_COLOR
}

/** Utilisation heat: green (idle) → amber → red (saturated). */
export function utilizationColor(u: number): string {
  if (u >= 0.85) return '#E0182D'
  if (u >= 0.6) return '#e0a83a'
  return '#5dcaa5'
}

export const PROVIDER_ACCENT: Record<NonNullable<CloudProvider>, string> = {
  AWS: '#ff9900',
  AZURE: '#0089d6',
  GOOGLE: '#4285f4',
  ORACLE: '#f80000',
  IBM: '#0530ad',
}
