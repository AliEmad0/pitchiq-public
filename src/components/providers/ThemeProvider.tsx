"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

// `attribute="class"` flips the `.dark` selector on <html>, which is what the
// OKLCH token blocks in globals.css expect (TASK-101). `enableSystem` lets the
// initial render honor the OS-level color scheme; once the user toggles, the
// preference is persisted by next-themes in localStorage.
//
// `disableTransitionOnChange` suppresses the brief color-fade flash that would
// otherwise animate every themed property on toggle.
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
