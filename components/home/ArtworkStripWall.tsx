"use client";

/**
 * ArtworkStripWall
 *
 * Six horizontal strips of CMS artwork thumbnails drifting via pure CSS
 * @keyframes — no requestAnimationFrame, no JS per-frame work.
 *
 * Each row selects tiles completely at random from the CMS collection.
 * Truly random per-tile (not shuffled-and-repeated), so no visible patterns.
 */

import { useMemo, useState, useCallback } from "react";
import { getStripThumbnailUrl } from "@/components/images/cloudinary";
import type { CmsProject } from "@/components/archive/types";
import styles from "./ArtworkStripWall.module.css";

// ─── Strip configuration ──────────────────────────────────────────────────────
// tile px + gap = unit step
const TILE_SIZE = 140; // px (visual size of each tile)
const GAP       = 4;   // px gap between tiles
const UNIT      = TILE_SIZE + GAP; // 144 px per step

// Each row: direction and target drift speed in px/second.
// 2–4 px/s gives barely-perceptible motion — premium, museum-quality.
const ROW_CONFIG = [
  { dir:  1 as const, speed: 2.6 },  // row 0 — rightward, slowest
  { dir: -1 as const, speed: 3.4 },  // row 1 — leftward
  { dir:  1 as const, speed: 2.2 },  // row 2 — rightward, very slow
  { dir: -1 as const, speed: 3.8 },  // row 3 — leftward
  { dir:  1 as const, speed: 2.9 },  // row 4 — rightward
  { dir: -1 as const, speed: 3.1 },  // row 5 — leftward, mid
] as const;

// Number of tiles per row. Each is truly random-picked from the CMS.
// More tiles = longer before a repeat cycles back into view.
const TILES_PER_ROW = 28;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build the tile list for one row — each tile is truly random-picked
 * from the full project list. No shuffling, no pattern repetition.
 */
function buildRowTiles(projects: CmsProject[], rowIndex: number): CmsProject[] {
  if (projects.length === 0) return [];
  
  // Seed the random number generator deterministically per row
  // so SSR and client produce the same tiles.
  let seed = 0x1a3b5c7d + rowIndex * 0x9e3779b9;
  
  const result: CmsProject[] = [];
  for (let i = 0; i < TILES_PER_ROW; i++) {
    // Linear congruential generator for deterministic randomness
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    const idx = seed % projects.length;
    result.push(projects[idx]);
  }
  return result;
}

// ─── StripRow ─────────────────────────────────────────────────────────────────

interface StripRowProps {
  tiles: CmsProject[];
  rowIndex: number;
  dir: 1 | -1;
  speed: number; // px/s
  focusedId: string | null;
  onFocus: (id: string | null) => void;
}

function StripRow({ tiles, rowIndex, dir, speed, focusedId, onFocus }: StripRowProps) {
  // The CSS animation shifts the track by exactly one tile width.
  // This way the loop is seamless and tiles slide continuously.
  const loopWidth    = tiles.length * UNIT;  // px — full row width
  const duration     = loopWidth / speed;    // seconds

  const animClass = dir === 1 ? styles.driftRight : styles.driftLeft;

  return (
    <div className={styles.row} aria-hidden="true">
      <div
        className={`${styles.track} ${animClass}`}
        style={{
          ["--loop-width" as string]: `${loopWidth}px`,
          ["--duration"   as string]: `${duration}s`,
          // Stagger start time so rows don't all align on load.
          animationDelay: `${-(rowIndex * 3.7)}s`,
        }}
      >
        {/* Render tiles doubled so the loop is seamless */}
        {Array(2).fill(null).map((_, copy) => (
          tiles.map((project, idx) => {
            const src       = getStripThumbnailUrl(project.frontCover);
            const isFocused = focusedId === project.id;
            const isDimmed  = focusedId !== null && !isFocused;

            return (
              <div
                key={`${copy}-${project.id}-${idx}`}
                className={[
                  styles.tile,
                  isFocused ? styles.tileFocused : "",
                  isDimmed  ? styles.tileDimmed  : "",
                ].join(" ")}
                onMouseEnter={() => onFocus(project.id)}
                onMouseLeave={() => onFocus(null)}
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
          })
        ))}
      </div>
    </div>
  );
}

// ─── ArtworkStripWall ─────────────────────────────────────────────────────────

interface ArtworkStripWallProps {
  projects: CmsProject[];
}

export function ArtworkStripWall({ projects }: ArtworkStripWallProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleFocus = useCallback((id: string | null) => {
    setFocusedId(id);
  }, []);

  // Build each row's tile list once — stable across renders.
  // Each row gets completely random tiles.
  const rows = useMemo(
    () => ROW_CONFIG.map((cfg, i) => ({
      ...cfg,
      tiles: buildRowTiles(projects, i),
    })),
    [projects],
  );

  if (projects.length === 0) return null;

  return (
    <div className={styles.wall} aria-hidden="true">
      {rows.map((row, i) => (
        <StripRow
          key={i}
          rowIndex={i}
          tiles={row.tiles}
          dir={row.dir}
          speed={row.speed}
          focusedId={focusedId}
          onFocus={handleFocus}
        />
      ))}
    </div>
  );
}
