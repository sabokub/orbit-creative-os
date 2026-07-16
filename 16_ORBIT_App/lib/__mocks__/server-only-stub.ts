// Test-only stand-in for the "server-only" marker package, which throws
// unconditionally when required outside a Next.js server bundle. Vitest runs
// in plain Node, so vitest.config.ts aliases "server-only" to this no-op.
export {};
