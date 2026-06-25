import { describe, it, expect } from 'vitest'
import { adaptProducts, type RawProduct } from './megaportClient'

const SY3 = { name: 'Equinix SY3', metro: 'Sydney', country: 'Australia' }

describe('adaptProducts', () => {
  it('maps a Megaport port to a PORT node', () => {
    const t = adaptProducts([
      { productUid: 'p1', productName: 'Port A', productType: 'MEGAPORT', provisioningStatus: 'LIVE', portSpeed: 10000 },
    ])
    expect(t.nodes).toHaveLength(1)
    expect(t.nodes[0]).toMatchObject({ productUid: 'p1', type: 'PORT', status: 'LIVE', portSpeed: 10000 })
  })

  it('maps MCR2 → MCR and MVE → MVE', () => {
    const t = adaptProducts([
      { productUid: 'r1', productType: 'MCR2', provisioningStatus: 'LIVE' },
      { productUid: 'e1', productType: 'MVE', provisioningStatus: 'CONFIGURED' },
    ])
    expect(t.nodes.map((n) => n.type)).toEqual(['MCR', 'MVE'])
  })

  it('synthesizes a cloud on-ramp node from a VXC B-End that is not an owned product', () => {
    const products: RawProduct[] = [
      { productUid: 'mcr1', productType: 'MCR2', provisioningStatus: 'LIVE', locationDetail: SY3 },
      {
        productUid: 'vxc1',
        productType: 'VXC',
        provisioningStatus: 'LIVE',
        rateLimit: 2000,
        aEnd: { productUid: 'mcr1' },
        bEnd: { productUid: 'aws-1', productName: 'AWS Direct Connect' },
      },
    ]
    const t = adaptProducts(products)
    const cloud = t.nodes.find((n) => n.productUid === 'aws-1')
    expect(cloud).toMatchObject({ type: 'CLOUD', provider: 'AWS' })
    // a cloud on-ramp inherits the metro of the service it connects to
    expect(cloud?.location.metro).toBe('Sydney')
  })

  it('does not duplicate a cloud node shared by multiple VXCs', () => {
    const products: RawProduct[] = [
      { productUid: 'mcr1', productType: 'MCR2', provisioningStatus: 'LIVE' },
      { productUid: 'v1', productType: 'VXC', provisioningStatus: 'LIVE', aEnd: { productUid: 'mcr1' }, bEnd: { productUid: 'aws-1', productName: 'AWS' } },
      { productUid: 'v2', productType: 'VXC', provisioningStatus: 'LIVE', aEnd: { productUid: 'mcr1' }, bEnd: { productUid: 'aws-1', productName: 'AWS' } },
    ]
    const t = adaptProducts(products)
    expect(t.nodes.filter((n) => n.productUid === 'aws-1')).toHaveLength(1)
  })

  it('carries rateLimit and shutDown onto the VXC', () => {
    const t = adaptProducts([
      { productUid: 'p1', productType: 'MEGAPORT', provisioningStatus: 'LIVE' },
      { productUid: 'p2', productType: 'MEGAPORT', provisioningStatus: 'LIVE' },
      { productUid: 'v1', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 500, shutDown: true, aEnd: { productUid: 'p1' }, bEnd: { productUid: 'p2' } },
    ])
    expect(t.vxcs[0]).toMatchObject({ rateLimit: 500, shutDown: true })
  })

  it('defaults an unknown status to CONFIGURED and tolerates missing fields', () => {
    const t = adaptProducts([{ productUid: 'p1', productType: 'MEGAPORT' }])
    expect(t.nodes[0].status).toBe('CONFIGURED')
    expect(t.nodes[0].portSpeed).toBe(0)
  })
})
