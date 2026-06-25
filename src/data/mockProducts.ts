// Fixture shaped EXACTLY like a real Megaport `GET /v2/products` response body
// (envelope: { message, terms, data: [...] }; field names per docs.megaport.com).
// This is fake data, but the contract is the real one — so swapping to the live
// Staging API is a pure data-source change, no parsing changes.
//
// Note: cloud on-ramps (AWS/Azure/Google) are NOT listed as products here —
// just like the real API, they exist only as the B-End of a Cloud VXC and are
// synthesized into nodes by adaptProducts().

import type { ProvisioningStatus } from '../types/megaport'

interface MegaportProduct {
  productUid: string
  productName: string
  productType: 'MEGAPORT' | 'MCR2' | 'MVE' | 'VXC'
  provisioningStatus: ProvisioningStatus
  portSpeed?: number
  rateLimit?: number
  locationId?: number
  locationDetail?: { name: string; metro: string; country: string }
  market?: string
  provider?: 'AWS' | 'AZURE' | 'GOOGLE'
  aEnd?: { productUid: string; vlan?: number }
  bEnd?: { productUid: string; productName?: string }
  shutDown?: boolean
  contractTermMonths?: number
  createDate?: number
}

const SY3 = { name: 'Equinix SY3', metro: 'Sydney', country: 'Australia' }
const ME1 = { name: 'NextDC M1', metro: 'Melbourne', country: 'Australia' }

const products: MegaportProduct[] = [
  // Ports (productType MEGAPORT)
  { productUid: 'a49cf3f1-20a1-4390-93aa-5005bdafe3d7', productName: 'SYD Primary Port', productType: 'MEGAPORT', provisioningStatus: 'LIVE', portSpeed: 10000, locationId: 3, locationDetail: SY3, market: 'AU' },
  { productUid: 'b27dd4a2-3f51-4b80-9c11-77a2e3f1aa01', productName: 'SYD Secondary Port', productType: 'MEGAPORT', provisioningStatus: 'LIVE', portSpeed: 10000, locationId: 3, locationDetail: SY3, market: 'AU' },
  { productUid: 'c83fa7b9-1d22-49aa-8e30-1c2233445566', productName: 'MEL Edge Port', productType: 'MEGAPORT', provisioningStatus: 'LIVE', portSpeed: 1000, locationId: 5, locationDetail: ME1, market: 'AU' },
  // MCR (productType MCR2) + MVE
  { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415', productName: 'SYD Cloud Router', productType: 'MCR2', provisioningStatus: 'LIVE', portSpeed: 5000, locationId: 3, locationDetail: SY3, market: 'AU' },
  { productUid: 'e1d2c3b4-5566-4778-99aa-bbccddeeff00', productName: 'MEL Virtual Edge (SD-WAN)', productType: 'MVE', provisioningStatus: 'CONFIGURED', portSpeed: 2000, locationId: 5, locationDetail: ME1, market: 'AU' },
  // VXCs (private connections between A-End and B-End). Cloud B-Ends carry a
  // productName so adaptProducts() can synthesize the on-ramp node + detect the CSP.
  { productUid: 'vxc-1a2b3c4d-0001', productName: 'SYD Port → MCR', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 5000, aEnd: { productUid: 'a49cf3f1-20a1-4390-93aa-5005bdafe3d7', vlan: 100 }, bEnd: { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415' } },
  { productUid: 'vxc-1a2b3c4d-0002', productName: 'SYD Secondary → MCR', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 2000, aEnd: { productUid: 'b27dd4a2-3f51-4b80-9c11-77a2e3f1aa01', vlan: 101 }, bEnd: { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415' } },
  { productUid: 'vxc-1a2b3c4d-0003', productName: 'MCR → AWS', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 2000, aEnd: { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415', vlan: 200 }, bEnd: { productUid: 'f0aws1111-2222-4333-8444-555566667777', productName: 'AWS Direct Connect' } },
  { productUid: 'vxc-1a2b3c4d-0004', productName: 'MCR → Azure', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 1000, aEnd: { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415', vlan: 201 }, bEnd: { productUid: 'f0azr2222-3333-4444-8555-666677778888', productName: 'Azure ExpressRoute' } },
  { productUid: 'vxc-1a2b3c4d-0005', productName: 'MEL Port → MVE', productType: 'VXC', provisioningStatus: 'CONFIGURED', rateLimit: 1000, aEnd: { productUid: 'c83fa7b9-1d22-49aa-8e30-1c2233445566', vlan: 300 }, bEnd: { productUid: 'e1d2c3b4-5566-4778-99aa-bbccddeeff00' } },
  { productUid: 'vxc-1a2b3c4d-0006', productName: 'MVE → Google', productType: 'VXC', provisioningStatus: 'DEPLOYABLE', rateLimit: 1000, aEnd: { productUid: 'e1d2c3b4-5566-4778-99aa-bbccddeeff00', vlan: 301 }, bEnd: { productUid: 'f0gcp3333-4444-4555-8666-777788889999', productName: 'Google Cloud Interconnect' } },
  { productUid: 'vxc-1a2b3c4d-0007', productName: 'SYD MCR → MEL MVE (inter-metro)', productType: 'VXC', provisioningStatus: 'LIVE', rateLimit: 1000, aEnd: { productUid: 'd0c1e2f3-aabb-4ccd-9e8f-101112131415', vlan: 400 }, bEnd: { productUid: 'e1d2c3b4-5566-4778-99aa-bbccddeeff00' } },
]

export const mockProductsResponse = {
  message: 'Products retrieved',
  terms:
    'This data is subject to the Acceptable Use Policy https://www.megaport.com/legal/acceptable-use-policy',
  data: products,
}
