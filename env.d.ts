/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to 'live' to hit the Megaport Staging API; anything else uses bundled mock data. */
  readonly VITE_MEGAPORT_SOURCE?: 'mock' | 'live'
  /** Megaport API base URL, e.g. https://api-staging.megaport.com */
  readonly VITE_MEGAPORT_BASE_URL?: string
  /** OAuth2 token endpoint, e.g. https://auth-m2m-staging.megaport.com/oauth2/token */
  readonly VITE_MEGAPORT_AUTH_URL?: string
  /** API key client id (Portal → Tools → API Key Generator). You supply this — never committed. */
  readonly VITE_MEGAPORT_API_KEY?: string
  /** API key client secret. You supply this — never committed. */
  readonly VITE_MEGAPORT_API_SECRET?: string
  /** Optional pre-generated bearer token (alternative to key/secret). */
  readonly VITE_MEGAPORT_TOKEN?: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
