import { describe, expect, it } from "vitest";

import { canonicalPath } from "@/utils/canonical";
import { currentDataSeason } from "@/utils/season";

// TASK-SEO: self-referencing canonicals. Search Console reported
// "User-declared canonical: N/A" — Next emits no canonical by itself. The
// resolved value is relative; `metadataBase` turns it absolute.
describe("canonicalPath", () => {
  describe("locale prefixing (localePrefix: 'as-needed')", () => {
    it("keeps English un-prefixed", () => {
      expect(canonicalPath("en", "/teams")).toBe("/teams");
    });

    it("prefixes Arabic with /ar", () => {
      expect(canonicalPath("ar", "/teams")).toBe("/ar/teams");
    });

    it("maps the English root to /", () => {
      expect(canonicalPath("en", "/")).toBe("/");
    });

    it("maps the Arabic root to /ar (not /ar/)", () => {
      expect(canonicalPath("ar", "/")).toBe("/ar");
    });

    it("handles nested entity routes in both locales", () => {
      expect(canonicalPath("en", "/teams/42")).toBe("/teams/42");
      expect(canonicalPath("ar", "/players/1001863")).toBe("/ar/players/1001863");
    });

    it("treats an unknown locale as the un-prefixed default", () => {
      expect(canonicalPath("fr", "/teams")).toBe("/teams");
    });
  });

  describe("season normalisation", () => {
    it("omits the season when it is the default (bare path and ?season=<default> are the same page)", () => {
      expect(canonicalPath("en", "/", currentDataSeason())).toBe("/");
      expect(canonicalPath("en", "/fixtures", currentDataSeason())).toBe("/fixtures");
    });

    it("omits the season when none is given", () => {
      expect(canonicalPath("en", "/fixtures")).toBe("/fixtures");
    });

    it("keeps a non-default season so each historical season stays indexable", () => {
      expect(canonicalPath("en", "/", 1998)).toBe("/?season=1998");
      expect(canonicalPath("en", "/fixtures", 1998)).toBe("/fixtures?season=1998");
    });

    it("combines the Arabic prefix with a non-default season", () => {
      expect(canonicalPath("ar", "/teams/42", 2001)).toBe("/ar/teams/42?season=2001");
    });

    it("keeps the Arabic root with a non-default season", () => {
      expect(canonicalPath("ar", "/", 1998)).toBe("/ar?season=1998");
    });
  });

  describe("path hygiene", () => {
    it("strips a trailing slash so one page never has two canonicals", () => {
      expect(canonicalPath("en", "/teams/")).toBe("/teams");
    });

    it("never returns an empty string", () => {
      expect(canonicalPath("en", "")).toBe("/");
    });
  });
});
