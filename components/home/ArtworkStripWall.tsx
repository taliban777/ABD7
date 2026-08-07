"use client";

/**
 * ArtworkStripWall — eight CSS-animated rows of CMS artwork thumbnails.
 * Each row shuffles the full project list with a unique seed and repeats it
 * enough times to fill a seamless loop. Renders nothing on the server
 * (client-only mount) to avoid hydration mismatches.
 */

import { useEffect, useMemo, useState } from "react";
import { getStripThumbnailUrl } from "@/components/images/cloudinary";
import type { CmsProject } from "@/components/archive/types";
import styles from "./ArtworkStripWall.module.css";

// ─── Strip configuration ──────────────────────────────────────────────────────
// Tile size in px — tiles are flush with zero gap.
const TILE_SIZE = 140;

// Each row: direction and target drift speed in px/second.
// dir  1 = rightward (CSS: driftRight — starts at -loopWidth, ends at 0)
// dir -1 = leftward  (CSS: driftLeft  — starts at 0, ends at -loopWidth)
const ROW_CONFIG = [
  { dir: -1 as const, speed: 2.4 },  // row 0 — leftward (new top row)
  { dir:  1 as const, speed: 2.6 },  // row 1 — rightward, slowest
  { dir: -1 as const, speed: 3.4 },  // row 2 — leftward
  { dir:  1 as const, speed: 2.2 },  // row 3 — rightward, very slow
  { dir: -1 as const, speed: 3.8 },  // row 4 — leftward
  { dir:  1 as const, speed: 2.9 },  // row 5 — rightward
  { dir: -1 as const, speed: 3.1 },  // row 6 — leftward, mid
  { dir:  1 as const, speed: 2.7 },  // row 7 — rightward (new bottom row)
] as const;

// Number of CMS-copy repetitions inside the track.
// The animation loops by shifting exactly one copy-set width —
// so we need at least: ceil(viewportWidth / (n × TILE_SIZE)) + 2 copies.
// Using 8 copies covers up to ~7680 px wide viewports with ≥1 project.
// With many projects (e.g. 20+) this is already ~40 000 px — plenty.
const COPIES = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array, does not mutate the input. */
function shuffle<T>(arr: T[], seed: number): T[] {
  const out = [...arr];
  // Deterministic seeded shuffle so SSR and client produce the same order.
  let s = seed;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Build the tile list for one row.
 * - Shuffles the full project list with a row-specific seed.
 * - Repeats COPIES times to ensure the CSS loop never shows a gap.
 */
function buildRowTiles(projects: CmsProject[], rowIndex: number): CmsProject[] {
  if (projects.length === 0) return [];
  // Use a prime-offset seed so adjacent rows never start identically.
  const seed = 0x1a3b5c7d + rowIndex * 0x9e3779b9;
  const shuffled = shuffle(projects, seed);
  const result: CmsProject[] = [];
  for (let i = 0; i < COPIES; i++) result.push(...shuffled);
  return result;
}

// ─── StripRow ─────────────────────────────────────────────────────────────────

interface StripRowProps {
  tiles: CmsProject[];
  rowIndex: number;
  dir: 1 | -1;
  speed: number; // px/s
}

function StripRow({ tiles, rowIndex, dir, speed }: StripRowProps) {
  // loopWidth = one full copy-set width (no gap — tiles are flush).
  // The CSS keyframe shifts by exactly this distance so the reset is invisible.
  const projectCount = tiles.length / COPIES;        // original count before repeating
  const loopWidth    = projectCount * TILE_SIZE;     // px — one full copy (no gap)
  const duration     = loopWidth / speed;      // seconds

  // dir  1 → driftRight: track starts at -loopWidth, ends at 0
  // dir -1 → driftLeft:  track starts at 0, ends at -loopWidth
  const animClass = dir === 1 ? styles.driftRight : styles.driftLeft;

  return (
    <div className={styles.row} aria-hidden="true">
      <div
        className={`${styles.track} ${animClass}`}
        style={{
          // Expose the loop width and duration as CSS custom properties
          // so a single pair of @keyframes can handle any row.
          ["--loop-width" as string]: `${loopWidth}px`,
          ["--duration"   as string]: `${duration}s`,
          // Stagger start time so rows don't all align on load.
          animationDelay: `${-(rowIndex * 3.7)}s`,
        }}
      >
        {tiles.map((project, idx) => {
          const src = getStripThumbnailUrl(project.frontCover);

          return (
            <div
              key={`${project.id}-${idx}`}
              className={styles.tile}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                width={TILE_SIZE}
                height={TILE_SIZE}
                loading="lazy"
                decoding="async"
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ArtworkStripWall ─────────────────────────────────────────────────────────

interface ArtworkStripWallProps {
  projects: CmsProject[];
}

export function ArtworkStripWall({ projects }: ArtworkStripWallProps) {
  // Render nothing on the server — this wall is purely decorative and
  // outputting thousands of SSR tile nodes causes hydration mismatches.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Build each row's tile list once — stable across renders.
  const rows = useMemo(
    () => ROW_CONFIG.map((cfg, i) => ({
      ...cfg,
      tiles: buildRowTiles(projects, i),
    })),
    [projects],
  );

  if (!mounted || projects.length === 0) return null;

  return (
    <div className={styles.wall} aria-hidden="true">
      {rows.map((row, i) => (
        <StripRow
          key={i}
          rowIndex={i}
          tiles={row.tiles}
          dir={row.dir}
          speed={row.speed}
        />
      ))}
    </div>
  );
}
