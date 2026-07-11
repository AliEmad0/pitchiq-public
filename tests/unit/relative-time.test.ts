import { describe, expect, it } from "vitest";

import { relativeTimeFromNow } from "@/utils/relative-time";

const NOW = new Date("2026-06-20T12:00:00Z");
const ago = (ms: number) => new Date(NOW.getTime() - ms).toISOString();

const SEC = 1000;
const MIN = 60 * SEC;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe("relativeTimeFromNow (English)", () => {
  it("renders sub-minute deltas via Intl (numeric:auto)", () => {
    expect(relativeTimeFromNow(ago(30 * SEC), "en", NOW)).toBe("30 seconds ago");
  });

  it("pluralizes minutes and hours", () => {
    expect(relativeTimeFromNow(ago(1 * MIN), "en", NOW)).toBe("1 minute ago");
    expect(relativeTimeFromNow(ago(5 * MIN), "en", NOW)).toBe("5 minutes ago");
    expect(relativeTimeFromNow(ago(1 * HOUR), "en", NOW)).toBe("1 hour ago");
    expect(relativeTimeFromNow(ago(3 * HOUR), "en", NOW)).toBe("3 hours ago");
  });

  it("says 'yesterday' for one day and 'N days ago' up to a week", () => {
    expect(relativeTimeFromNow(ago(1 * DAY), "en", NOW)).toBe("yesterday");
    expect(relativeTimeFromNow(ago(2 * DAY), "en", NOW)).toBe("2 days ago");
    expect(relativeTimeFromNow(ago(6 * DAY), "en", NOW)).toBe("6 days ago");
  });

  it("buckets into weeks, months, and years (numeric:auto idioms)", () => {
    expect(relativeTimeFromNow(ago(7 * DAY), "en", NOW)).toBe("last week");
    expect(relativeTimeFromNow(ago(20 * DAY), "en", NOW)).toBe("2 weeks ago");
    expect(relativeTimeFromNow(ago(45 * DAY), "en", NOW)).toBe("last month");
    expect(relativeTimeFromNow(ago(200 * DAY), "en", NOW)).toBe("6 months ago");
    expect(relativeTimeFromNow(ago(400 * DAY), "en", NOW)).toBe("last year");
  });

  it("clamps a future timestamp to 'now'", () => {
    expect(relativeTimeFromNow(new Date(NOW.getTime() + 5 * MIN).toISOString(), "en", NOW)).toBe(
      "now",
    );
  });

  it("returns '' for an unparseable date", () => {
    expect(relativeTimeFromNow("not-a-date", "en", NOW)).toBe("");
  });

  it("defaults to English when no locale is passed", () => {
    expect(relativeTimeFromNow(ago(1 * DAY), undefined, NOW)).toBe("yesterday");
  });
});

describe("relativeTimeFromNow (Arabic)", () => {
  it("localizes the relative phrase with Eastern-Arabic digits", () => {
    expect(relativeTimeFromNow(ago(1 * DAY), "ar", NOW)).toBe("أمس");
    expect(relativeTimeFromNow(ago(6 * DAY), "ar", NOW)).toBe("قبل ٦ أيام");
    expect(relativeTimeFromNow(ago(20 * DAY), "ar", NOW)).toBe("قبل أسبوعين");
    expect(relativeTimeFromNow(ago(200 * DAY), "ar", NOW)).toBe("قبل ٦ أشهر");
  });
});
