# Megaport Topology Visualizer

[![CI](https://github.com/AitorGallardo/megaport-network-visualizer/actions/workflows/ci.yml/badge.svg)](https://github.com/AitorGallardo/megaport-network-visualizer/actions/workflows/ci.yml)

> An unsolicited proof-of-work demo for the **Megaport Frontend Software Engineer** role — by **Aitor Gallardo**.
> Built in Megaport's actual frontend stack: **Vue 3 · Vite · TypeScript · Tailwind · TanStack Query**.

**Interactive highlights:** live packet-flow animation with per-link utilisation · click-to-focus that dims everything off the selected path · provision a VXC and watch it climb `DEPLOYABLE → CONFIGURED → LIVE` · shut a link down / bring it back up — all persisted through a refresh.

## Why I built this

The Megaport Portal's core job is letting customers provision and understand network connectivity — **Ports → VXCs → MCR / MVE → cloud on-ramps**. That structure is fundamentally a *graph*, but provisioning UIs often surface it as tables and forms. So I built the "see your whole network at a glance" view: an interactive topology that lays services out the way traffic actually flows (Ports on the left, MCR/MVE routing in the middle, AWS/Azure/Google on-ramps on the right), encodes committed bandwidth as line thickness, and colour-codes provisioning status.

It's deliberately scoped to a weekend, but it's meant to show four things at once:

1. **Your stack** — real Vue 3 SFCs, composables, TanStack Query for caching/loading/error/refetch, Tailwind, strict TypeScript, Vite build.
2. **Your domain** — it models Megaport's real entities and vocabulary (VXC, MCR, MVE, on-ramp, rate limit, provisioning status) from your public docs.
3. **Your API** — the data layer is built to consume the real Megaport REST API; it ships with realistic mock data and swaps to the **Staging** environment with one env var.
4. **Product instinct** — a view I'd want as a Portal user, applied to your highest-value web property.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173  (mock data, no account needed)
npm run build    # type-checks with vue-tsc, then builds with Vite
```

## Point it at the real Megaport Staging API

The whole app reads from one seam — `fetchTopology()` in `src/api/megaportClient.ts`.
Megaport offers a **public Staging environment** (`api-staging.megaport.com`) where services
aren't deployed or billed and reset every 24h — perfect for a live demo.

```bash
# .env.local  (gitignored — your token never gets committed)
VITE_MEGAPORT_SOURCE=live
VITE_MEGAPORT_BASE_URL=https://api-staging.megaport.com
VITE_MEGAPORT_TOKEN=<bearer token from your own Megaport login>
```

The `live` path calls `GET /v2/products`, then `adaptProducts()` normalizes Megaport's
response shape into the same `Topology` model the UI already renders — so nothing else changes.

> Note: I intentionally use the **public, documented REST API** and the non-billed Staging
> environment. No decompiling, no private endpoints, no scraping — just the same integration
> path a Portal engineer would take.

## Architecture

```
src/
  types/megaport.ts        # domain model (Port, VXC, MCR, MVE, cloud on-ramp)
  constants/theme.ts       # single source of truth for status / utilisation colours
  domain/topology.ts       # pure helpers: node grouping, committed bandwidth, neighbourhood
  data/mockProducts.ts     # fixture shaped like GET /v2/products (clouds derived from VXC B-Ends)
  api/megaportClient.ts    # the seam: typed read/write adapters, mock today → Staging API tomorrow
  composables/
    useTopology.ts         # TanStack Query wrapper (cache / loading / error / refetch)
    useTopologyStore.ts    # mutable topology: create / set-rate / shut-down + provisioning sim
    useFlowElements.ts     # layered Vue Flow nodes + edges (Ports → routers → clouds)
    useTraffic.ts          # synthetic live utilisation per VXC, for the packet-flow animation
  components/
    TopologyGraph.vue      # interactive Vue Flow graph: focus mode + legend
    TrafficEdge.vue        # custom edge with animated packets whose speed tracks utilisation
    MegaportNode.vue       # custom node renderer (Port / MCR / MVE / cloud, per-CSP accent)
    NodeDetail.vue         # inspector panel for a selected node + its VXCs
    ActionPanel.vue        # provision a VXC, edit its rate, or shut it down
    SummaryBar.vue         # at-a-glance counts and committed access bandwidth
  App.vue, main.ts
```

Tested with **Vitest** (`npm test`) — the data/domain layer (`adaptProducts` + topology helpers) — and **type-checked + built in CI** on every push.

## What I'd do next (if this were real work)
- Wire the `create VXC` + `find a location` flows against the live Staging API (they already round-trip in mock mode, writes persisting through Refresh).
- Real graph layout (dagre / ELK) and a geographic metro map once node counts grow.
- Playwright end-to-end coverage on top of the Vitest unit layer.
- Pull it into an Nx library so it drops straight into the Portal monorepo.

---

*Contact: Aitor Gallardo · aitorgamu@gmail.com · I'm Brisbane-based and authorised to work in Australia.*
