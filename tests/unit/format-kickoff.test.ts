import { describe, expect, it } from "vitest";

import { formatKickoff, formatShortDate } from "@/utils/format-kickoff";

describe("formatKickoff", () => {
  it("renders as 'Day, D Mon · HH:MM' with the comma after the weekday", () => {
    // 2024-08-16T19:00 UTC → 20:00 London (BST = UTC+1)
    expect(formatKickoff("2024-08-16T19:00:00Z")).toBe("Fri, 16 Aug · 20:00");
  });

  it("shifts UK summer (BST) kickoffs forward by one hour vs UTC", () => {
    // BST runs late March → late October. Aug 16 sits squarely inside BST.
    expect(formatKickoff("2024-08-16T14:30:00Z")).toBe("Fri, 16 Aug · 15:30");
  });

  it("does NOT shift UK winter (GMT) kickoffs — Jan is GMT = UTC", () => {
    // GMT in Jan, so the displayed time equals the UTC time of day.
    expect(formatKickoff("2025-01-04T15:00:00Z")).toBe("Sat, 4 Jan · 15:00");
  });

  it("crosses the day boundary correctly across the BST↔GMT DST transition", () => {
    // 23:30 UTC on 26 Oct 2024 is the last day of BST — London is 00:30
    // on Sun 27 Oct (clocks fall back at 02:00 BST → 01:00 GMT later).
    expect(formatKickoff("2024-10-26T23:30:00Z")).toBe("Sun, 27 Oct · 00:30");
  });

  it("uses 24-hour time (no AM/PM) and zero-pads hours", () => {
    expect(formatKickoff("2024-01-04T07:05:00Z")).toBe("Thu, 4 Jan · 07:05");
  });

  it("English output is unchanged when the locale is passed explicitly", () => {
    expect(formatKickoff("2024-08-16T19:00:00Z", "en-GB")).toBe("Fri, 16 Aug · 20:00");
  });

  it("renders Arabic month/weekday names with Eastern-Arabic digits + London time", () => {
    // 2024-08-16 20:00 London → أغسطس (August), Arabic day ١٦, 24h time ٢٠:٠٠.
    const s = formatKickoff("2024-08-16T19:00:00Z", "ar");
    expect(s).toContain("أغسطس");
    expect(s).toContain("١٦");
    expect(s).toContain("٢٠:٠٠");
    expect(s).not.toMatch(/[0-9]/); // no ASCII digits
  });
});

describe("formatShortDate", () => {
  it("renders as 'Day D Mon' — no comma, no time", () => {
    expect(formatShortDate("2024-08-16T19:00:00Z")).toBe("Fri 16 Aug");
  });

  it("uses Europe/London — a UTC kickoff that crosses midnight rolls to next London day", () => {
    // 23:30 UTC on a BST day → 00:30 the next day in London.
    expect(formatShortDate("2024-08-16T23:30:00Z")).toBe("Sat 17 Aug");
  });

  it("formats single-digit days without leading zero", () => {
    expect(formatShortDate("2025-01-04T15:00:00Z")).toBe("Sat 4 Jan");
  });

  it("renders Arabic month/weekday names with Eastern-Arabic digits", () => {
    const s = formatShortDate("2024-08-16T19:00:00Z", "ar");
    expect(s).toContain("أغسطس");
    expect(s).toContain("١٦");
  });
});
