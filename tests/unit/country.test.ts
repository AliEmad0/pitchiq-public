import { describe, it, expect } from "vitest";

import { countryNameFromCode } from "../../src/utils/country";

describe("countryNameFromCode", () => {
  it("maps an ISO-2 code to a display name", () => {
    expect(countryNameFromCode("fr")).toBe("France");
    expect(countryNameFromCode("pt")).toBe("Portugal");
  });

  it("maps home-nation flag codes", () => {
    expect(countryNameFromCode("gb-eng")).toBe("England");
    expect(countryNameFromCode("gb-sct")).toBe("Scotland");
    expect(countryNameFromCode("gb-wls")).toBe("Wales");
    expect(countryNameFromCode("gb-nir")).toBe("Northern Ireland");
  });

  it("returns null for null/unknown", () => {
    expect(countryNameFromCode(null)).toBeNull();
    expect(countryNameFromCode(undefined)).toBeNull();
    expect(countryNameFromCode("zz")).toBeNull();
    expect(countryNameFromCode("notacode")).toBeNull();
  });
});
