import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

// TASK-1603 (final batch) — the anti-hardcoded-string GUARD. Parses every
// localized UI surface (the `[locale]` pages + feature/layout components) with
// the TypeScript AST and fails on a literal user-facing string that should have
// gone through the message catalog (`useTranslations`/`getTranslations`). This
// keeps the i18n extraction from silently regressing.
//
// It flags: (a) JSX text nodes, and (b) the text-bearing JSX attributes below —
// when the value is a plain string literal containing a run of ≥2 ASCII letters
// (so separators like "·"/"—", numbers, single letters like the captain "C",
// and pure `{t(...)}` expressions never trip it).
//
// Intentional exceptions are allowlisted below with a reason. Deliberately
// NON-localized surfaces (root not-found / global-error render outside the
// intl provider; the OG-image renderers are English brand images) are excluded
// via SKIP_DIRS.

const ROOT = path.resolve(__dirname, "../../src");

const SCAN_DIRS = [
  path.join(ROOT, "app", "[locale]"),
  path.join(ROOT, "features"),
  path.join(ROOT, "components", "layout"),
];

// Directory fragments whose files are excluded from the scan.
const SKIP_DIRS = [
  path.join(ROOT, "app", "api"), // OG-image renderers — English brand images
];

const TEXT_ATTRS = new Set([
  "aria-label",
  "placeholder",
  "title",
  "alt",
  "aria-valuetext",
  "aria-description",
]);

// Exact trimmed literals that are intentional (brand tokens, deliberately kept
// acronyms). Keep this list SHORT — a new entry means "we chose not to
// translate this"; prefer a message key unless it's a true brand/data token.
const ALLOWED = new Set([
  "PitchIQ", // brand wordmark (PitchIQLogo)
  "Pitch", // brand wordmark half
  "IQ", // brand wordmark half
  "VAR", // brand token — the "VAR review" boundary panel + event-icon acronym
]);

// Files excluded entirely.
const SKIP_FILES = new Set([
  path.join(ROOT, "components", "brand", "PitchIQLogo.tsx"), // brand wordmark
  path.join(ROOT, "features", "leagues", "components", "SeasonEndedCard.tsx"), // dead code (TASK-M13), retained unused
]);

// An `aria-hidden="true"` element's text is decorative (not exposed to users /
// AT) — e.g. the retro-era Ceefax strip. Its subtree is skipped.
function isAriaHidden(opening: ts.JsxOpeningElement | ts.JsxSelfClosingElement): boolean {
  return opening.attributes.properties.some(
    (p) =>
      ts.isJsxAttribute(p) &&
      ts.isIdentifier(p.name) &&
      p.name.text === "aria-hidden" &&
      p.initializer != null &&
      ((ts.isStringLiteral(p.initializer) && p.initializer.text === "true") ||
        (ts.isJsxExpression(p.initializer) &&
          p.initializer.expression?.kind === ts.SyntaxKind.TrueKeyword)),
  );
}

function tsxFiles(dir: string): string[] {
  let entries: import("node:fs").Dirent[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (SKIP_DIRS.some((d) => full.startsWith(d))) continue;
    if (e.isDirectory()) out.push(...tsxFiles(full));
    else if (e.name.endsWith(".tsx") && !e.name.includes(".test.")) out.push(full);
  }
  return out;
}

const hasWords = (s: string) => /[A-Za-z]{2,}/.test(s);

type Finding = { file: string; line: number; text: string; kind: "text" | "attr" };

function scan(file: string, source: string): Finding[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings: Finding[] = [];
  const rel = path.relative(ROOT, file);

  const record = (node: ts.Node, raw: string, kind: Finding["kind"]) => {
    const text = raw.trim();
    if (!hasWords(text) || ALLOWED.has(text)) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    findings.push({ file: rel, line: line + 1, text, kind });
  };

  const visit = (node: ts.Node, hidden: boolean) => {
    let nowHidden = hidden;
    if (ts.isJsxElement(node) && isAriaHidden(node.openingElement)) nowHidden = true;
    if (ts.isJsxSelfClosingElement(node) && isAriaHidden(node)) nowHidden = true;

    if (!nowHidden) {
      if (ts.isJsxText(node)) {
        record(node, node.text, "text");
      } else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name)) {
        const name = node.name.text;
        if (TEXT_ATTRS.has(name) && node.initializer && ts.isStringLiteral(node.initializer)) {
          record(node.initializer, node.initializer.text, "attr");
        }
      }
    }
    ts.forEachChild(node, (c) => visit(c, nowHidden));
  };
  visit(sf, false);
  return findings;
}

describe("no hardcoded user-facing strings (TASK-1603 guard)", () => {
  const files = SCAN_DIRS.flatMap(tsxFiles).filter((f) => !SKIP_FILES.has(f));

  it("scans a non-trivial number of localized component files", () => {
    // Sanity: the globbing works (a broken path shouldn't silently pass).
    expect(files.length).toBeGreaterThan(40);
  });

  it("has no literal JSX text or text-attribute outside the message catalog", () => {
    const findings = files.flatMap((f) => scan(f, readFileSync(f, "utf8")));
    const report = findings
      .map((x) => `  ${x.file}:${x.line} [${x.kind}] ${JSON.stringify(x.text)}`)
      .join("\n");
    expect(findings, findings.length ? `Hardcoded strings found:\n${report}` : "").toEqual([]);
  });
});
