import { describe, expect, it } from "vitest";

import { routing } from "@/i18n/routing";

describe("i18n routing", () => {
  it("declares en (default) + ar with as-needed prefixing", () => {
    expect(routing.locales).toEqual(["en", "ar"]);
    expect(routing.defaultLocale).toBe("en");
    expect(routing.localePrefix).toBe("as-needed");
  });
});
