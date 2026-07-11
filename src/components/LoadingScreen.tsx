import { useLocale } from "next-intl";

import { isRtl } from "@/utils/format";

/** SessionStorage flag marking that this browser session already saw the boot
 * loader. Read by the inline gate script AND the E2E spec. */
export const BOOT_SESSION_KEY = "pitchiq:booted";

// Once-per-session gate + scroll lock (the era-no-flash pattern): runs
// synchronously during parse. Repeat document load in the same session →
// stamp `data-booted` on <html> BEFORE first paint (CSS hides the overlay).
// First load → lock scrolling (`.boot-lock` on <html>: overflow hidden, so no
// scrollbar and no scrolling until the boot finishes), unlocked on the
// overlay's `boot-exit` animationend with a timeout fallback.
// ⚠️ Deliberately does NOT remove the overlay element: it's React-managed, so
// a pre-hydration `.remove()` is a hydration mismatch React would repair by
// RE-INSERTING it. <html> attributes/classes are outside the hydration scope
// (the data-era pattern). On storage errors the loader still self-dismisses
// via CSS and no lock is ever added, so it can never brick the app.
const BOOT_ONCE_SCRIPT = `(function(){try{
var k="${BOOT_SESSION_KEY}",d=document.documentElement;
if(sessionStorage.getItem(k)){d.dataset.booted="1";return;}
sessionStorage.setItem(k,"1");
d.classList.add("boot-lock");
var u=function(){d.classList.remove("boot-lock");};
var e=document.getElementById("boot-loader");
if(e)e.addEventListener("animationend",function(ev){if(ev.animationName==="boot-exit")u();});
setTimeout(u,4200);
}catch(_){}})();`;

/**
 * TASK-1702 — game-style branded boot loader ("Neon wordmark draw", owner
 * pick #20 of 20). A full-screen overlay rendered into the SSG HTML so it
 * paints before hydration: the brand wordmark draws itself as a glowing
 * outline stroke, floods with its final colors, a thin progress rail
 * completes beneath it, then the overlay fades out — all pure CSS on the
 * TASK-1701 motion tokens (see globals.css), era- and theme-aware via
 * `--primary`/`--background`. Decorative (`aria-hidden`); shows once per
 * browser session and locks scrolling while it plays. Reduced motion gets a
 * static branded frame (filled wordmark + full rail) that dismisses quickly.
 *
 * Locale-aware wordmark (owner pick): `/ar` draws the header's Nastaliq
 * lockup بيتش آي كيو — بيتش in the foreground tone, آي كيو in the accent —
 * mirroring `<PitchIQLogo>`'s two-tone; other locales draw the Latin
 * "PitchIQ". The per-tone flood color rides `--boot-fill` (the `boot-draw`
 * keyframes fill `var(--boot-fill, var(--primary))`), and on `/ar` the
 * animated classes sit on the tspans so each tone resolves its own var.
 */
export function LoadingScreen() {
  const locale = useLocale();
  const arabic = isRtl(locale);
  return (
    <div id="boot-loader" className="boot-loader" aria-hidden="true">
      <div className="boot-neon">
        {arabic ? (
          <svg viewBox="0 0 420 150" className="boot-neon-svg">
            <text x="50%" y="66" textAnchor="middle" direction="rtl" className="boot-neon-ar">
              <tspan className="boot-neon-text boot-tone-fg">{"بيتش "}</tspan>
              <tspan className="boot-neon-text">{"آي كيو"}</tspan>
            </text>
          </svg>
        ) : (
          <svg viewBox="0 0 420 100" className="boot-neon-svg">
            <text x="50%" y="70" textAnchor="middle" className="boot-neon-text">
              PitchIQ
            </text>
          </svg>
        )}
        <div className="boot-rail">
          <div className="boot-rail-fill" />
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: BOOT_ONCE_SCRIPT }} />
    </div>
  );
}
