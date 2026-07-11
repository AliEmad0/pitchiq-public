// One-off generator for the /map page geometry (TASK-M27).
//
// Input: data/.cache/ew-nuts1.json — England & Wales NUTS1 regions as GeoJSON
//   (lat/lng), from martinjc/UK-GeoJSON (ONS source, Open Government Licence v3).
//   Download: curl -sL \
//     https://raw.githubusercontent.com/martinjc/UK-GeoJSON/master/json/eurostat/ew/nuts1.json \
//     -o data/.cache/ew-nuts1.json
//
// Output: src/features/map/uk-map.ts — UK_MAP { viewBox, regions:[{id,name,d}] }.
//   Each region's coastline is Douglas-Peucker-simplified, then projected
//   (equirectangular with a cos(midLat) x-correction) into a 1000-wide viewBox.
//
// The SAME projection is exported as project()/PROJ so build-map-markers can
// place club markers at their real city coordinates. Re-run after changing the
// tolerance or source.
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "data/.cache/ew-nuts1.json";
const OUT = "src/features/map/uk-map.ts";
const TOL = 0.008; // degrees (~0.9 km) — coastline simplification tolerance
const W = 1000; // viewBox width

const geo = JSON.parse(readFileSync(SRC, "utf8"));

// --- bbox over all coordinates -------------------------------------------
let minLng = Infinity,
  minLat = Infinity,
  maxLng = -Infinity,
  maxLat = -Infinity;
function eachRing(geometry, fn) {
  const polys = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  for (const poly of polys) for (const ring of poly) fn(ring);
}
for (const f of geo.features)
  eachRing(f.geometry, (ring) => {
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  });

const midLat = (minLat + maxLat) / 2;
const sx = Math.cos((midLat * Math.PI) / 180);
const projW = (maxLng - minLng) * sx;
const projH = maxLat - minLat;
const scale = W / projW;
const H = Math.round(projH * scale);

function project([lng, lat]) {
  return [
    Math.round((lng - minLng) * sx * scale * 100) / 100,
    Math.round((maxLat - lat) * scale * 100) / 100,
  ];
}

// --- Douglas-Peucker on lng/lat ------------------------------------------
function perpDist(p, a, b) {
  const [px, py] = p,
    [ax, ay] = a,
    [bx, by] = b;
  const dx = bx - ax,
    dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(px - ax, py - ay);
  const t = ((px - ax) * dx + (py - ay) * dy) / len2;
  const cx = ax + t * dx,
    cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}
function dp(points, eps) {
  if (points.length < 3) return points;
  let dmax = 0,
    idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > dmax) {
      dmax = d;
      idx = i;
    }
  }
  if (dmax > eps) {
    const left = dp(points.slice(0, idx + 1), eps);
    const right = dp(points.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function ringToPath(ring) {
  const simp = dp(ring, TOL);
  if (simp.length < 4) return ""; // drop tiny islands
  return (
    simp
      .map((pt, i) => {
        const [x, y] = project(pt);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join("") + "Z"
  );
}

// Short region display names keyed by NUTS1 code (the raw NUTS112NM are long /
// truncated, e.g. "South West (England").
const REGION_NAMES = {
  UKC: "North East",
  UKD: "North West",
  UKE: "Yorkshire",
  UKF: "East Midlands",
  UKG: "West Midlands",
  UKH: "East of England",
  UKI: "London",
  UKJ: "South East",
  UKK: "South West",
  UKL: "Wales",
};

// Ray-casting point-in-polygon on [lng,lat] rings.
function pointInRing([x, y], ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i],
      [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
// Region (NUTS code) whose polygon contains the city; fallback to nearest centroid.
function regionForCity(lng, lat) {
  for (const f of geo.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const poly of polys) if (pointInRing([lng, lat], poly[0])) return f.properties.NUTS112CD;
  }
  let best = null,
    bestD = Infinity;
  for (const f of geo.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    const ring = polys[0][0];
    let cx = 0,
      cy = 0;
    for (const [px, py] of ring) {
      cx += px;
      cy += py;
    }
    cx /= ring.length;
    cy /= ring.length;
    const d = (cx - lng) ** 2 + (cy - lat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = f.properties.NUTS112CD;
    }
  }
  return best;
}

const regions = geo.features.map((f) => {
  let d = "";
  eachRing(f.geometry, (ring) => {
    d += ringToPath(ring);
  });
  return { id: f.properties.NUTS112CD, name: REGION_NAMES[f.properties.NUTS112CD], d };
});

const body = `// GENERATED by scripts/build-map.mjs — do not edit by hand.
// England & Wales NUTS1 regions, simplified + projected into a ${W}x${H} viewBox.
// Source: martinjc/UK-GeoJSON (ONS, Open Government Licence v3).
export const UK_MAP = {
  viewBox: "0 0 ${W} ${H}",
  regions: ${JSON.stringify(regions, null, 2)},
} as const;
`;
writeFileSync(OUT, body);

// --- markers: project each club's city through the SAME projection --------
// City centres (lat,lng). Clubs sharing a city are fanned on a small circle.
const CITY = {
  Newcastle: [54.976, -1.622],
  Sunderland: [54.914, -1.388],
  Middlesbrough: [54.578, -1.217],
  Leeds: [53.778, -1.572],
  Huddersfield: [53.654, -1.768],
  Sheffield: [53.383, -1.47],
  Barnsley: [53.552, -1.468],
  Hull: [53.746, -0.368],
  Bradford: [53.804, -1.759],
  Blackburn: [53.729, -2.489],
  Burnley: [53.789, -2.23],
  Blackpool: [53.821, -3.048],
  Manchester: [53.48, -2.245],
  Wigan: [53.548, -2.631],
  Bolton: [53.58, -2.529],
  Oldham: [53.541, -2.118],
  Liverpool: [53.408, -2.991],
  Birmingham: [52.487, -1.89],
  "West Bromwich": [52.509, -1.964],
  Wolverhampton: [52.59, -2.13],
  Coventry: [52.408, -1.495],
  "Stoke-on-Trent": [52.988, -2.176],
  Leicester: [52.62, -1.142],
  Nottingham: [52.94, -1.133],
  Derby: [52.915, -1.447],
  Norwich: [52.622, 1.309],
  Ipswich: [52.055, 1.145],
  Watford: [51.65, -0.402],
  Luton: [51.884, -0.431],
  London: [51.509, -0.118],
  Reading: [51.422, -0.983],
  Southampton: [50.906, -1.391],
  Portsmouth: [50.796, -1.064],
  Brighton: [50.862, -0.084],
  Bournemouth: [50.735, -1.838],
  Swindon: [51.564, -1.77],
  Swansea: [51.643, -3.935],
  Cardiff: [51.473, -3.203],
};
// [teamId, city, region]
const CLUBS = [
  [34, "Newcastle", "North East"],
  [746, "Sunderland", "North East"],
  [70, "Middlesbrough", "North East"],
  [63, "Leeds", "Yorkshire"],
  [37, "Huddersfield", "Yorkshire"],
  [62, "Sheffield", "Yorkshire"],
  [74, "Sheffield", "Yorkshire"],
  [747, "Barnsley", "Yorkshire"],
  [64, "Hull", "Yorkshire"],
  [1343, "Bradford", "Yorkshire"],
  [67, "Blackburn", "Lancashire"],
  [44, "Burnley", "Lancashire"],
  [1356, "Blackpool", "Lancashire"],
  [33, "Manchester", "Greater Manchester"],
  [50, "Manchester", "Greater Manchester"],
  [61, "Wigan", "Greater Manchester"],
  [68, "Bolton", "Greater Manchester"],
  [1349, "Oldham", "Greater Manchester"],
  [40, "Liverpool", "Merseyside"],
  [45, "Liverpool", "Merseyside"],
  [66, "Birmingham", "West Midlands"],
  [54, "Birmingham", "West Midlands"],
  [60, "West Bromwich", "West Midlands"],
  [39, "Wolverhampton", "West Midlands"],
  [1346, "Coventry", "West Midlands"],
  [75, "Stoke-on-Trent", "West Midlands"],
  [46, "Leicester", "East Midlands"],
  [65, "Nottingham", "East Midlands"],
  [69, "Derby", "East Midlands"],
  [71, "Norwich", "East of England"],
  [57, "Ipswich", "East of England"],
  [38, "Watford", "East of England"],
  [1359, "Luton", "East of England"],
  [42, "London", "Greater London"],
  [47, "London", "Greater London"],
  [48, "London", "Greater London"],
  [49, "London", "Greater London"],
  [36, "London", "Greater London"],
  [52, "London", "Greater London"],
  [55, "London", "Greater London"],
  [72, "London", "Greater London"],
  [1333, "London", "Greater London"],
  [1335, "London", "Greater London"],
  [53, "Reading", "South East"],
  [41, "Southampton", "South Coast"],
  [1355, "Portsmouth", "South Coast"],
  [51, "Brighton", "South Coast"],
  [35, "Bournemouth", "South Coast"],
  [1353, "Swindon", "South West"],
  [76, "Swansea", "Wales"],
  [43, "Cardiff", "Wales"],
];

function pct([lng, lat]) {
  const [x, y] = project([lng, lat]);
  return [(x / W) * 100, (y / H) * 100];
}
const byCity = {};
for (const c of CLUBS) (byCity[c[1]] ??= []).push(c);

// NUTS1 region per city (point-in-polygon) — all clubs in a city share it.
const cityRegion = {};
for (const city of Object.keys(byCity))
  cityRegion[city] = regionForCity(CITY[city][1], CITY[city][0]);

const geoOut = [];
for (const [city, clubs] of Object.entries(byCity)) {
  const [bx, by] = pct([CITY[city][1], CITY[city][0]]);
  const k = clubs.length;
  clubs.forEach(([teamId], i) => {
    let x = bx,
      y = by;
    if (k > 1) {
      const R = k === 2 ? 4.8 : 3.4 + k * 0.95; // fan radius (% of viewBox)
      const a = (-90 + (i * 360) / k) * (Math.PI / 180);
      x = bx + R * Math.cos(a);
      y = by + R * Math.sin(a);
    }
    geoOut.push({
      teamId,
      city,
      regionId: cityRegion[city],
      region: REGION_NAMES[cityRegion[city]],
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    });
  });
}
geoOut.sort((a, b) => a.teamId - b.teamId);

const geoBody = `// GENERATED by scripts/build-map.mjs — do not edit by hand.
// Each club is placed at its real city, projected through the SAME projection
// as the England & Wales map (src/features/map/uk-map.ts), with co-located
// clubs fanned on a small circle for legibility. x/y are PERCENTAGES of the
// map box (0..100). regionId (NUTS1 code) + region (name) drive the region modals.
export type GeoClub = { teamId: number; city: string; regionId: string; region: string; x: number; y: number };

export const GEO_REFERENCE: GeoClub[] = ${JSON.stringify(geoOut, null, 2)};
`;
writeFileSync("src/data/geo-reference.ts", geoBody);

console.log(
  JSON.stringify({ regions: regions.length, clubs: geoOut.length, viewBox: `${W}x${H}` }),
);
