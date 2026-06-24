import type { Topology, NetworkNode, VXC, ProvisioningStatus, CloudProvider } from '../types/megaport'
import { mockProductsResponse } from '../data/mockProducts'

/**
 * Megaport data layer.
 *
 * Both modes speak the SAME documented Megaport REST contract — the only
 * difference is whether the bytes come from a bundled fixture or the network.
 *
 * Endpoints (per docs.megaport.com / dev.megaport.com):
 *   • Auth (OAuth2 client-credentials):
 *       POST  https://auth-m2m-staging.megaport.com/oauth2/token   (grant_type=client_credentials)
 *   • List the company's services:
 *       GET   {baseUrl}/v2/products
 *   • (Provisioning, not used for read-only topology:)
 *       GET   {baseUrl}/v3/locations
 *       POST  {baseUrl}/v3/networkdesign/validate
 *       POST  {baseUrl}/v3/networkdesign/buy
 *
 * Mock mode returns a fixture shaped exactly like a real GET /v2/products body
 * ({ message, terms, data: [...] }), so the adapter below is the identical code
 * path in both modes. Flip with env vars (see README) — credentials are never
 * committed; you supply your own API key.
 */

const SOURCE = import.meta.env.VITE_MEGAPORT_SOURCE ?? 'mock'
const BASE_URL = import.meta.env.VITE_MEGAPORT_BASE_URL ?? 'https://api-staging.megaport.com'
const AUTH_URL =
  import.meta.env.VITE_MEGAPORT_AUTH_URL ?? 'https://auth-m2m-staging.megaport.com/oauth2/token'
const API_KEY = import.meta.env.VITE_MEGAPORT_API_KEY ?? ''
const API_SECRET = import.meta.env.VITE_MEGAPORT_API_SECRET ?? ''
// Optional: a pre-generated bearer token, if you'd rather not do the OAuth step in-app.
const STATIC_TOKEN = import.meta.env.VITE_MEGAPORT_TOKEN ?? ''

const LATENCY_MS = 450 // simulate the network so loading states are visible in mock mode

function delay<T>(value: T, ms = LATENCY_MS): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), ms))
}

export function dataSourceLabel(): 'mock' | 'live' {
  return SOURCE === 'live' ? 'live' : 'mock'
}

/** Public entry point used by the TanStack Query composable. */
export async function fetchTopology(): Promise<Topology> {
  const body = SOURCE === 'live' ? await getLiveProducts() : await delay(structuredClone(mockProductsResponse))
  // Megaport wraps payloads as { message, terms, data: [...] }.
  const products: any[] = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : [])
  return adaptProducts(products)
}

// ---------------------------------------------------------------------------
// WRITE operations — documented Megaport endpoints.
//   Create VXC:        POST {baseUrl}/v3/networkdesign/buy
//   Update/shutdown:   PUT  {baseUrl}/v3/product/vxc/{productUid}
// In mock mode these resolve locally (the composable applies the change to the
// in-memory store); in live mode they call the real endpoints with the token.
// ---------------------------------------------------------------------------

export interface CreateVxcInput {
  productName: string
  rateLimit: number
  aEndProductUid: string
  bEndProductUid: string
  aEndVlan?: number
}

export interface UpdateVxcInput {
  name?: string
  rateLimit?: number
  aEndVlan?: number
  bEndVlan?: number
  shutdown?: boolean
}

/** POST /v3/networkdesign/buy — body is the documented VXC order shape. */
export async function createVxc(input: CreateVxcInput): Promise<{ productUid: string }> {
  if (SOURCE !== 'live') {
    await delay(null, 350)
    // Persist into the fixture so the new VXC survives a Refresh (refetch),
    // exactly as a real order would once provisioned.
    const productUid = `vxc-${crypto.randomUUID().slice(0, 8)}`
    mockProductsResponse.data.push({
      productUid,
      productName: input.productName,
      productType: 'VXC',
      provisioningStatus: 'DEPLOYABLE',
      rateLimit: input.rateLimit,
      aEnd: { productUid: input.aEndProductUid, vlan: input.aEndVlan },
      bEnd: { productUid: input.bEndProductUid },
    })
    return { productUid }
  }
  const token = await getAccessToken()
  const orderBody = [
    {
      productUid: input.aEndProductUid,
      associatedVxcs: [
        {
          productName: input.productName,
          rateLimit: input.rateLimit,
          bEnd: { productUid: input.bEndProductUid },
          aEnd: input.aEndVlan != null ? { vlan: input.aEndVlan } : {},
        },
      ],
    },
  ]
  const res = await fetch(`${BASE_URL}/v3/networkdesign/buy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(orderBody),
  })
  if (!res.ok) throw new Error(`Create VXC ${res.status}: ${res.statusText}`)
  const json = await res.json()
  const uid = json?.data?.[0]?.technicalServiceUid ?? json?.data?.[0]?.productUid ?? ''
  return { productUid: uid }
}

/** PUT /v3/product/vxc/{productUid} — only the changed fields are sent. */
export async function updateVxc(productUid: string, changes: UpdateVxcInput): Promise<void> {
  if (SOURCE !== 'live') {
    await delay(null, 300)
    // Apply to the fixture so rate changes / shut-downs survive a Refresh.
    const p = mockProductsResponse.data.find((x) => x.productUid === productUid)
    if (p) {
      if (changes.name != null) p.productName = changes.name
      if (changes.rateLimit != null) p.rateLimit = changes.rateLimit
      if (changes.shutdown != null) p.shutDown = changes.shutdown
    }
    return
  }
  const token = await getAccessToken()
  // Megaport's field is `shutDown` (capital D); the rest pass through as-is.
  const body: Record<string, unknown> = {}
  if (changes.name != null) body.name = changes.name
  if (changes.rateLimit != null) body.rateLimit = changes.rateLimit
  if (changes.aEndVlan != null) body.aEndVlan = changes.aEndVlan
  if (changes.bEndVlan != null) body.bEndVlan = changes.bEndVlan
  if (changes.shutdown != null) body.shutDown = changes.shutdown
  const res = await fetch(`${BASE_URL}/v3/product/vxc/${productUid}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Update VXC ${res.status}: ${res.statusText}`)
}

// ---------------------------------------------------------------------------
// LIVE: OAuth2 token (client-credentials) → GET /v2/products
// ---------------------------------------------------------------------------

async function getAccessToken(): Promise<string> {
  if (STATIC_TOKEN) return STATIC_TOKEN
  if (!API_KEY || !API_SECRET) {
    throw new Error('Set VITE_MEGAPORT_API_KEY + VITE_MEGAPORT_API_SECRET (or VITE_MEGAPORT_TOKEN).')
  }
  // POST {AUTH_URL}  Basic <key:secret>  grant_type=client_credentials
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${API_KEY}:${API_SECRET}`)}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  })
  if (!res.ok) throw new Error(`Auth ${res.status}: ${res.statusText}`)
  const json = await res.json()
  return json.access_token as string
}

async function getLiveProducts(): Promise<any> {
  const token = await getAccessToken()
  const res = await fetch(`${BASE_URL}/v2/products`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Megaport API ${res.status}: ${res.statusText}`)
  return res.json()
}

// ---------------------------------------------------------------------------
// Adapter: Megaport product list  →  our Topology graph.
// Defensive so minor field differences across API versions don't crash the UI.
// ---------------------------------------------------------------------------

function adaptProducts(products: any[]): Topology {
  const nodes: NetworkNode[] = []
  const vxcs: VXC[] = []

  for (const p of products) {
    const type = String(p.productType ?? '').toUpperCase()

    if (type === 'VXC') {
      vxcs.push({
        productUid: p.productUid,
        productName: p.productName ?? 'VXC',
        type: 'VXC',
        status: normStatus(p.provisioningStatus),
        rateLimit: Number(p.rateLimit ?? 0),
        aEndUid: p.aEnd?.productUid ?? '',
        bEndUid: p.bEnd?.productUid ?? '',
        cloud: detectCloud(p.bEnd?.productName ?? p.csp_name ?? p.productName),
        vlan: p.aEnd?.vlan ?? undefined,
        shutDown: !!p.shutDown,
      })
    } else if (type === 'MEGAPORT' || type === 'MCR' || type === 'MCR2' || type === 'MVE') {
      const provider = (p.provider ?? undefined) as CloudProvider | undefined
      nodes.push({
        productUid: p.productUid,
        productName: p.productName ?? type,
        // A node fronting a cloud provider is a cloud on-ramp, not an MCR.
        type: provider ? 'CLOUD' : type === 'MVE' ? 'MVE' : type === 'MEGAPORT' ? 'PORT' : 'MCR',
        status: normStatus(p.provisioningStatus),
        portSpeed: Number(p.portSpeed ?? p.rateLimit ?? p.speed ?? 0),
        location: {
          id: p.locationId ?? p.aLocationId ?? 0,
          name: p.locationDetail?.name ?? p.aLocation ?? 'Unknown',
          metro: p.locationDetail?.metro ?? '',
          country: p.locationDetail?.country ?? p.market ?? '',
        },
        provider,
      })
    }
  }
  return { nodes, vxcs }
}

function normStatus(s: unknown): ProvisioningStatus {
  const v = String(s ?? '').toUpperCase()
  const allowed: ProvisioningStatus[] = ['LIVE', 'CONFIGURED', 'DEPLOYABLE', 'DECOMMISSIONED', 'CANCELLED']
  return allowed.find((a) => a === v) ?? 'CONFIGURED'
}

function detectCloud(name?: string): CloudProvider {
  const n = (name ?? '').toLowerCase()
  if (n.includes('aws') || n.includes('amazon')) return 'AWS'
  if (n.includes('azure') || n.includes('expressroute')) return 'AZURE'
  if (n.includes('google') || n.includes('gcp')) return 'GOOGLE'
  if (n.includes('oracle')) return 'ORACLE'
  if (n.includes('ibm')) return 'IBM'
  return null
}
