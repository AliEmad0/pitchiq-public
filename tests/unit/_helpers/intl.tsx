import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement, ReactNode } from "react";

import en from "@/i18n/messages/en.json";

// Wrap a component tree in the intl provider with the English catalog so
// `useTranslations` resolves to the real English strings (the default locale
// renders identically to the pre-i18n UI, so existing assertions still pass).
//
// Uses RTL's `wrapper` option (not a manual `<Provider>{ui}</Provider>`) so the
// provider persists across `rerender(...)` — the players-table season-change
// test rerenders and would otherwise lose the intl context.
export function renderWithIntl(ui: ReactElement, locale = "en") {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={en}>
        {children}
      </NextIntlClientProvider>
    );
  }
  return render(ui, { wrapper: Wrapper });
}
