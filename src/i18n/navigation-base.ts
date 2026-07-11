import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// The RAW locale-aware navigation primitives (TASK-1703 split). Do NOT import
// `Link` from here in app code — use `@/i18n/navigation`, whose `Link` wraps
// this one with the zoom-fade View Transition (TransitionLink). This file
// exists so the wrapper can build on the raw Link without an import cycle.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
