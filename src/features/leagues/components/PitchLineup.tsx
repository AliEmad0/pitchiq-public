import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

import { CaptainBadge } from "@/features/players/components/CaptainBadge";
import type { FixtureDetail, FixtureLineup, LineupPlayerSlot } from "@/types/api";
import { withSeason } from "@/utils/season";

// One vertical pitch (viewBox 0 0 100 140). Home in the bottom half,
// away mirrored on top. Players placed by `player.grid` ("row:col" with
// row 1 closest to your own goal). Anyone with an unparseable grid is
// rendered on the bench strip instead of being dropped silently.
//
// TASK-1512 ("L02") redesign: a formation bar above a larger, centred pitch,
// with both benches below. HALF_H leaves a gap either side of the halfway line
// so the two teams' attackers don't stack on top of each other at the centre.

const PITCH_W = 100;
const PITCH_H = 140;
const HALF_H = 52;
const HOME_Y_MAX = PITCH_H - 10;
const AWAY_Y_MIN = 10;

function parseGrid(g: string | null): [number, number] | null {
  if (!g) return null;
  const [r, c] = g.split(":").map(Number);
  return Number.isInteger(r) && Number.isInteger(c) ? [r, c] : null;
}

type Placed = { slot: LineupPlayerSlot; x: number; y: number };
type LayoutResult = { placed: Placed[]; benched: LineupPlayerSlot[] };

function layoutTeam(startXI: LineupPlayerSlot[], side: "home" | "away"): LayoutResult {
  const byRow = new Map<number, LineupPlayerSlot[]>();
  const benched: LineupPlayerSlot[] = [];

  for (const slot of startXI) {
    const grid = parseGrid(slot.player.grid);
    if (!grid) {
      benched.push(slot);
      continue;
    }
    const [r] = grid;
    byRow.set(r, [...(byRow.get(r) ?? []), slot]);
  }

  const rows = [...byRow.keys()].sort((a, b) => a - b);
  const rowCount = rows.length;
  if (rowCount === 0) return { placed: [], benched };

  const placed: Placed[] = [];
  const rowStep = HALF_H / Math.max(rowCount - 1, 1);

  rows.forEach((r, rIdx) => {
    const slots = (byRow.get(r) ?? []).sort((a, b) => {
      const ca = parseGrid(a.player.grid)?.[1] ?? 0;
      const cb = parseGrid(b.player.grid)?.[1] ?? 0;
      return ca - cb;
    });

    const y = side === "home" ? HOME_Y_MAX - rIdx * rowStep : AWAY_Y_MIN + rIdx * rowStep;

    slots.forEach((slot, i) => {
      const xFrac = (i + 1) / (slots.length + 1);
      // Mirror x for the away team so RW/LW stay on the visual side a TV
      // viewer would expect.
      const x = side === "home" ? xFrac * PITCH_W : (1 - xFrac) * PITCH_W;
      placed.push({ slot, x, y });
    });
  });

  return { placed, benched };
}

type Kit = { fill: string; text: string };

function PlayerDot({
  placed,
  side,
  kit,
  season,
}: {
  placed: Placed;
  side: "home" | "away";
  kit?: Kit | null;
  season?: number;
}) {
  const t = useTranslations("fixtures");
  // TASK-M47 — paint the dot with the team's kit color (home XI = home kit,
  // away XI = away kit) when known, with a contrasting number. A thin light
  // ring keeps dark kits visible on the dark pitch. Falls back to the theme
  // tokens (primary/secondary) when no kit color is committed for the club.
  const fallbackFill = side === "home" ? "fill-primary" : "fill-secondary stroke-white";
  return (
    <g>
      <circle
        cx={placed.x}
        cy={placed.y}
        r={3.6}
        className={kit ? "stroke-white/55 stroke-[0.5]" : `${fallbackFill} stroke-2`}
        style={kit ? { fill: kit.fill } : undefined}
        data-player-id={placed.slot.player.id}
      />
      <text
        x={placed.x}
        y={placed.y + 1.1}
        fontSize="3.1"
        textAnchor="middle"
        className={kit ? undefined : "fill-primary-foreground"}
        style={kit ? { fill: kit.text } : undefined}
      >
        {placed.slot.player.number ?? ""}
      </text>
      {placed.slot.player.profileId != null ? (
        // M21 — link the surname to the player's profile.
        <a href={withSeason(`/players/${placed.slot.player.profileId}`, season)}>
          <text
            x={placed.x}
            y={placed.y + 8}
            fontSize="2.7"
            textAnchor="middle"
            className="fill-white"
          >
            {placed.slot.player.name.split(" ").slice(-1)[0]}
          </text>
        </a>
      ) : (
        <text
          x={placed.x}
          y={placed.y + 8}
          fontSize="2.7"
          textAnchor="middle"
          className="fill-white"
        >
          {placed.slot.player.name.split(" ").slice(-1)[0]}
        </text>
      )}
      {placed.slot.player.isCaptain && (
        // TASK-M21 — captain's armband: a small "C" disc at the dot's top-right.
        <g data-captain="true" aria-label={t("captain")}>
          <circle cx={placed.x + 3.2} cy={placed.y - 3.2} r={1.8} className="fill-primary" />
          <text
            x={placed.x + 3.2}
            y={placed.y - 2.4}
            fontSize="2.4"
            textAnchor="middle"
            className="fill-primary-foreground font-bold"
          >
            C
          </text>
        </g>
      )}
    </g>
  );
}

function BenchStrip({
  title,
  slots,
  season,
}: {
  title: string;
  slots: LineupPlayerSlot[];
  season?: number;
}) {
  if (slots.length === 0) return null;
  return (
    <div className="mt-2">
      <h3 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </h3>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {slots.map(({ player }) => (
          <li
            key={player.id}
            className="bg-card inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          >
            <span>
              {player.number !== null ? `#${player.number} ` : ""}
              {player.profileId != null ? (
                // M21 — link the bench player to their profile.
                <Link
                  href={withSeason(`/players/${player.profileId}`, season)}
                  className="hover:underline"
                >
                  {player.name}
                </Link>
              ) : (
                player.name
              )}
            </span>
            {player.isCaptain && <CaptainBadge className="size-3.5 text-[0.55rem]" />}
          </li>
        ))}
      </ul>
    </div>
  );
}

// One side's panel below the pitch: the manager line (when known) + the bench.
function SidePanel({
  lineup,
  benched,
  fallbackName,
  season,
}: {
  lineup: FixtureLineup | undefined;
  benched: LineupPlayerSlot[];
  fallbackName: string;
  season?: number;
}) {
  const t = useTranslations("fixtures");
  const name = lineup?.team.name ?? fallbackName;
  const manager = lineup?.coach.name?.trim();
  const managerId = lineup?.coach.managerId;
  const slots = [...(lineup?.substitutes ?? []), ...benched];
  if (!manager && slots.length === 0) return null;
  return (
    <div className="bg-card/40 rounded-md border p-3">
      {manager && (
        <p className="text-muted-foreground text-xs">
          <span className="font-semibold">{t("manager")}</span>{" "}
          {managerId ? (
            // M21 — link the manager to their profile.
            <Link href={withSeason(`/managers/${managerId}`, season)} className="hover:underline">
              {manager}
            </Link>
          ) : (
            manager
          )}
        </p>
      )}
      <BenchStrip title={t("benchTitle", { name })} slots={slots} season={season} />
    </div>
  );
}

// The formation bar above the pitch (TASK-1512, mobile-fixed TASK-1513): each
// team reads crest · name · formation. On mobile the two teams STACK into their
// own full-width rows (so full club names fit and the formation never wraps —
// the old side-by-side layout squeezed "Bournemouth" to "Bournemo…" and broke
// "4-2-3-1" onto two lines on a 375px phone). From `sm` up they sit side-by-side
// (home left, away right).
function FormationBar({
  detail,
  homeLineup,
  awayLineup,
}: {
  detail: FixtureDetail;
  homeLineup?: FixtureLineup;
  awayLineup?: FixtureLineup;
}) {
  const ht = detail.fixture.teams.home;
  const at = detail.fixture.teams.away;
  const crest = (logo: string) => (
    <Image
      src={logo}
      alt=""
      width={20}
      height={20}
      className="size-5 shrink-0 object-contain"
      unoptimized
    />
  );
  const formationTag = (formation: string | null | undefined) =>
    formation ? (
      <span className="text-muted-foreground font-normal whitespace-nowrap">· {formation}</span>
    ) : null;
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-card px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <span className="flex min-w-0 items-center gap-2 font-semibold">
        {crest(ht.logo)}
        <span className="truncate">{ht.name}</span>
        {formationTag(homeLineup?.formation)}
      </span>
      <span className="flex min-w-0 items-center gap-2 font-semibold sm:justify-end">
        {crest(at.logo)}
        <span className="truncate">{at.name}</span>
        {formationTag(awayLineup?.formation)}
      </span>
    </div>
  );
}

export function PitchLineup({ detail, season }: { detail: FixtureDetail; season?: number }) {
  const t = useTranslations("fixtures");
  if (detail.lineups.length === 0) {
    return (
      <p
        role="status"
        aria-label={t("lineupsPending")}
        className="text-muted-foreground bg-card rounded-md border p-6 text-sm"
      >
        {t("lineupsPending")}
      </p>
    );
  }

  const homeId = detail.fixture.teams.home.id;
  const homeLineup = detail.lineups.find((l) => l.team.id === homeId);
  const awayLineup = detail.lineups.find((l) => l.team.id !== homeId);

  const homeLayout = homeLineup
    ? layoutTeam(homeLineup.startXI, "home")
    : { placed: [], benched: [] };
  const awayLayout = awayLineup
    ? layoutTeam(awayLineup.startXI, "away")
    : { placed: [], benched: [] };

  return (
    <div className="space-y-4">
      <FormationBar detail={detail} homeLineup={homeLineup} awayLineup={awayLineup} />

      <svg
        viewBox={`0 0 ${PITCH_W} ${PITCH_H}`}
        // A pitch is always green grass — fixed colour + white lines, never
        // re-skinned by the era/light-dark theme.
        className="mx-auto w-full max-w-lg rounded-md border bg-[#1a7a40]"
        aria-label={t("pitchAria")}
      >
        {/* Mown grass stripes. */}
        {[1, 3, 5].map((i) => (
          <rect
            key={`stripe-${i}`}
            x="5"
            y={5 + (i * (PITCH_H - 10)) / 7}
            width={PITCH_W - 10}
            height={(PITCH_H - 10) / 7}
            fill="#ffffff"
            opacity="0.05"
          />
        ))}
        <rect
          x="5"
          y="5"
          width={PITCH_W - 10}
          height={PITCH_H - 10}
          fill="none"
          className="stroke-white/55"
          strokeWidth="0.4"
        />
        <line
          x1="5"
          y1={PITCH_H / 2}
          x2={PITCH_W - 5}
          y2={PITCH_H / 2}
          className="stroke-white/55"
          strokeWidth="0.4"
        />
        <circle
          cx={PITCH_W / 2}
          cy={PITCH_H / 2}
          r="8"
          fill="none"
          className="stroke-white/55"
          strokeWidth="0.4"
        />
        <rect
          x={PITCH_W / 2 - 20}
          y="5"
          width="40"
          height="15"
          fill="none"
          className="stroke-white/55"
          strokeWidth="0.4"
        />
        <rect
          x={PITCH_W / 2 - 20}
          y={PITCH_H - 20}
          width="40"
          height="15"
          fill="none"
          className="stroke-white/55"
          strokeWidth="0.4"
        />
        {homeLayout.placed.map((p) => (
          <PlayerDot
            key={`h-${p.slot.player.id}`}
            placed={p}
            side="home"
            kit={homeLineup?.kit}
            season={season}
          />
        ))}
        {awayLayout.placed.map((p) => (
          <PlayerDot
            key={`a-${p.slot.player.id}`}
            placed={p}
            side="away"
            kit={awayLineup?.kit}
            season={season}
          />
        ))}
      </svg>

      <div className="grid gap-3 sm:grid-cols-2">
        <SidePanel
          lineup={homeLineup}
          benched={homeLayout.benched}
          fallbackName={t("homeSide")}
          season={season}
        />
        <SidePanel
          lineup={awayLineup}
          benched={awayLayout.benched}
          fallbackName={t("awaySide")}
          season={season}
        />
      </div>
    </div>
  );
}
