// Stub for the `server-only` package used by Vitest.
// Production code imports `server-only` to fail the build if it leaks into a
// Client Component. Under Vitest (happy-dom) the real package throws at
// module load, breaking otherwise-legitimate server-module tests. This stub
// is aliased in via `vitest.config.ts` so tests can exercise server modules.
export {};
