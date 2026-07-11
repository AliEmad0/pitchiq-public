import { useTranslations } from "next-intl";
import { memo } from "react";

import { UK_MAP } from "../uk-map";

// England & Wales for the /map page, drawn as its NUTS1 regions. Each region is
// a clickable, keyboard-operable button (TASK-M27 follow-up) that opens its
// modal via `onSelectRegion`. Fill/stroke use the `--muted`/`--border` tokens
// (era- and mode-aware). Memoized — `onSelectRegion` must be stable (the parent
// wraps it in useCallback), so season changes never re-render this.
export const UkMap = memo(function UkMap({
  onSelectRegion,
}: {
  onSelectRegion: (id: string) => void;
}) {
  const t = useTranslations("map");
  return (
    <svg
      viewBox={UK_MAP.viewBox}
      role="img"
      aria-label={t("mapAria")}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {UK_MAP.regions.map((r) => (
        <path
          key={r.id}
          d={r.d}
          className="uk-region"
          role="button"
          tabIndex={0}
          aria-label={t("regionAria", { name: r.name })}
          fill="var(--muted)"
          stroke="var(--border)"
          strokeWidth={1.25}
          vectorEffect="non-scaling-stroke"
          onClick={() => onSelectRegion(r.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectRegion(r.id);
            }
          }}
        />
      ))}
    </svg>
  );
});
