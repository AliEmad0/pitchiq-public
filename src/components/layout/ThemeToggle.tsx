"use client";

import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

// Two-way toggle (light ↔ dark) instead of the three-way system → light → dark
// cycle: simpler mental model, one click always flips the visible mode. The
// initial `system` default still applies on first paint; toggling explicitly
// from `system` resolves to the opposite of whatever the OS currently is.
//
// `mounted` gate: next-themes can only read localStorage on the client, so
// during SSR `resolvedTheme` is undefined. Rendering the icon before mount
// would either flash the wrong icon or trip a hydration mismatch. We render
// a disabled placeholder with the correct dimensions until mount.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("controls");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-hidden
        tabIndex={-1}
        disabled
        className="opacity-0"
      />
    );
  }

  const isDark = resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      // ix-glow (TASK-1705): the ghost variant is quiet by default, but the
      // ticket names the theme toggle explicitly — give it the hover halo.
      className="ix-glow"
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? t("switchToDark") : t("switchToLight")}
    >
      {isDark ? <Moon /> : <Sun />}
      <span className="sr-only">{t("toggleTheme")}</span>
    </Button>
  );
}
