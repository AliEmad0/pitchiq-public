import { describe, expect, it } from "vitest";

import { normalizeName } from "@/utils/normalize-name";

describe("normalizeName", () => {
  it("folds case, diacritics, and punctuation", () => {
    expect(normalizeName("Bruno Fernandes")).toBe("bruno fernandes");
    expect(normalizeName("Gylfi Sigurðsson")).toBe("gylfi sigurdsson");
    expect(normalizeName("N'Golo Kanté")).toBe("n golo kante");
    expect(normalizeName("  Heung-Min  Son ")).toBe("heung min son");
  });
});
