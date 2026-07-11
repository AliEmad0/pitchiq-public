import { describe, expect, it } from "vitest";

import ar from "@/i18n/messages/ar.json";
import en from "@/i18n/messages/en.json";

function keyPaths(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === "object"
      ? keyPaths(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  );
}

describe("i18n catalog parity", () => {
  it("ar.json covers every key in en.json", () => {
    const arKeys = keyPaths(ar as Record<string, unknown>);
    const missing = keyPaths(en as Record<string, unknown>).filter(
      (path) => !arKeys.includes(path),
    );
    expect(missing).toEqual([]);
  });
});
