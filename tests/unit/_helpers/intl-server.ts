import en from "@/i18n/messages/en.json";

// Mock implementation of `next-intl/server` for unit tests of Server Components
// (TASK-1603). Returns the real English strings from the catalog with basic
// `{param}` interpolation, so `render(await SomeServerComponent())` resolves
// `getTranslations(ns)` without a request context.
//
// Usage in a test file:
//   vi.mock("next-intl/server", () => import("./_helpers/intl-server"));
type Dict = Record<string, unknown>;

export async function getTranslations(ns?: string) {
  const base: Dict = ns ? ((en as Dict)[ns] as Dict) : (en as Dict);
  return (key: string, values?: Record<string, unknown>) => {
    let msg = String(base?.[key] ?? key);
    if (values) {
      for (const [k, v] of Object.entries(values)) msg = msg.replaceAll(`{${k}}`, String(v));
    }
    return msg;
  };
}

export function setRequestLocale() {}

// Default test locale — the English catalog above. Async server components that
// call `getLocale()` (e.g. <Footer>, the locale-aware formatters in TASK-1605)
// resolve to "en" so their formatted output matches the English strings.
export async function getLocale() {
  return "en";
}

export async function getMessages() {
  return en;
}
