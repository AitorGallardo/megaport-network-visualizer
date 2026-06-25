import { defineConfig } from 'vitest/config'

// Unit tests target the pure data/domain layer (adapter + topology helpers),
// which need no DOM — so the lightweight node environment is enough.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
