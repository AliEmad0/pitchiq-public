import { setupServer } from "msw/node";

import { handlers } from "./handlers";

// Node-side MSW server, used by Vitest (started/stopped in tests/setup.ts).
// Future Playwright tests that exercise server-side fetches will start the
// same server inside the Next.js process via instrumentation.ts; the
// handlers list is shared so there's exactly one mock surface.
export const server = setupServer(...handlers);
