import { describe, it, expect } from 'vitest'
import { committedAccessMbps, groupNodes, neighborhood } from './topology'
import type { NetworkNode, Topology, VXC } from '../types/megaport'

const loc = { id: 0, name: '', metro: '', country: '' }
const node = (productUid: string, type: NetworkNode['type']): NetworkNode => ({
  productUid,
  productName: productUid,
  type,
  status: 'LIVE',
  portSpeed: type === 'PORT' ? 10000 : 0,
  location: loc,
})
const vxc = (productUid: string, aEndUid: string, bEndUid: string, rateLimit: number, extra: Partial<VXC> = {}): VXC => ({
  productUid,
  productName: productUid,
  type: 'VXC',
  status: 'LIVE',
  rateLimit,
  aEndUid,
  bEndUid,
  ...extra,
})

const topo: Topology = {
  nodes: [node('p1', 'PORT'), node('mcr1', 'MCR'), node('aws', 'CLOUD')],
  vxcs: [vxc('v1', 'p1', 'mcr1', 5000), vxc('v2', 'mcr1', 'aws', 2000)],
}

describe('groupNodes', () => {
  it('splits nodes into ports, routers and clouds', () => {
    const g = groupNodes(topo)
    expect(g.ports.map((n) => n.productUid)).toEqual(['p1'])
    expect(g.routers.map((n) => n.productUid)).toEqual(['mcr1'])
    expect(g.clouds.map((n) => n.productUid)).toEqual(['aws'])
  })
})

describe('committedAccessMbps', () => {
  it('counts only VXCs touching a Port, so transit legs are not double-counted', () => {
    expect(committedAccessMbps(topo)).toBe(5000) // v1 (Port→MCR) only; v2 (MCR→AWS) excluded
  })

  it('excludes shut-down VXCs', () => {
    const t2: Topology = { ...topo, vxcs: [vxc('v1', 'p1', 'mcr1', 5000, { shutDown: true }), topo.vxcs[1]] }
    expect(committedAccessMbps(t2)).toBe(0)
  })
})

describe('neighborhood', () => {
  it('returns a node plus its directly connected nodes', () => {
    expect([...neighborhood(topo, 'mcr1')].sort()).toEqual(['aws', 'mcr1', 'p1'])
  })

  it('returns both endpoints when given a VXC id', () => {
    expect([...neighborhood(topo, 'v2')].sort()).toEqual(['aws', 'mcr1'])
  })
})
