// All wire handlers were removed across TASK-505 (Dashboard),
// TASK-506 (Teams), and TASK-507 (Comparison). The migrated fetchers
// read from committed snapshot JSON snapshots — see src/data/loaders.ts.
//
// `tests/msw/server.ts` remains in place. Tests can still call
// `server.use(http.get(...))` to mock any rare wire call (e.g.
// a future fetcher that adds a non-snapshot dependency), but the default
// handler list is empty.

import type { HttpHandler } from "msw";

export const handlers: HttpHandler[] = [];
