// Browser-side MSW worker, ready for Playwright once any client-component
// fetch lands (e.g. the PlayerSearch combobox in TASK-404). Until then this
// module exists as the second half of the shared-fixture contract — the
// handlers list is identical to the Node-side setup in tests/msw/server.ts,
// so a single change to tests/msw/handlers.ts updates both surfaces.
//
// To activate: generate the service worker with `pnpm exec msw init public/`,
// then start the worker from a client provider:
//
//   import { worker } from "@/../tests/msw/browser";
//   if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_MSW === "1") {
//     worker.start({ onUnhandledRequest: "bypass" });
//   }
//
// Wiring this is deferred to the first ticket that adds a client-side fetch.
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
