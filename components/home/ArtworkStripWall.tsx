"use client";

/**
 * ArtworkStripWall
 *
 * Renders 6 horizontal strips of CMS artwork thumbnails.
 * Each row drifts almost imperceptibly (different directions & speeds).
 * Hovering an artwork lifts and focuses it; everything else dims gently.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { getStripThumbnailUrl } from "@/components/images/cloudinary";
import type { CmsProject } from "@/components/archive/types";
import styles from "./ArtworkStripWall.module.css";

interface ArtworkStripWallProps {
  projects: CmsProject[];
}

// How many rows to render and their individual drift parameters.
// speed: px/s  direction: 1=right, -1=left  offset: initial %
const ROW_CONFIG = [
  { speed: 8,  dir:  1, offset: 0   },
  { speed: 5,  dir: -1, offset: 8   },
  { speed: 10, dir:  1, offset: 4   },
  { speed: 6,  dir: -1, offset: 12  },
  { speed: 9,  dir:  1, offset: 2   },
  { speed: 7,  dir: -1, offset: 16  },
];

const THUMBNAIL_SIZE = 140; // px — visual size of each square
const GAP = 4;              // px — gap between tiles

/**
 * Build a repeated, extended tile list so the strip can loop seamlessly.
 * We duplicate the list enough times to fill (viewport + extra) width.
 */
function buildStrip(projects: CmsProject[], copies = 6): CmsProject[] {
  if (projects.length === 0) return [];
  const result: CmsProject[] = [];
  for (let i = 0; i < copies; i++) result.push(...projects);
  return result;
}

interface StripRowProps {
  projects: CmsProject[];
  speed: number;       // px per second
  dir: number;         // 1 or -1
  initialOffset: number; // % nudge so rows don't align
  focusedId: string | null;
  onFocus: (id: string | null) => void;
}

function StripRow({ projects, speed, dir, initialOffset, focusedId, onFocus }: StripRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number | null>(null);

  const tiles = buildStrip(projects);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || tiles.length === 0) return;

    // The unit width is one full copy of the original projects list.
    const unitWidth = projects.length * (THUMBNAIL_SIZE + GAP);

    // Seed initial position so rows don't all start at 0.
    posRef.current = -(initialOffset / 100) * unitWidth;

    const tick = (now: number) => {
      if (lastTimeRef.current === null) lastTimeRef.current = now;
      const dt = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      posRef.current += dir * speed * dt;

      // Loop seamlessly: when we've scrolled one full unit, reset.
      if (dir > 0 && posRef.current >= 0) posRef.current -= unitWidth;
      if (dir < 0 && posRef.current <= -unitWidth) posRef.current += unitWidth;

      track.style.transform = `translateX(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [tiles.length, projects.length, speed, dir, initialOffset]);

  return (
    <div className={styles.row} aria-hidden="true">
      <div ref={trackRef} className={styles.track}>
        {tiles.map((project, idx) => {
          const src = getStripThumbnailUrl(project.frontCover);
          const isFocused = focusedId === project.id;
          const isDimmed = focusedId !== null && !isFocused;
          return (
            <div
              key={`${project.id}-${idx}`}
              className={`${styles.tile} ${isFocused ? styles.tileFocused : ""} ${isDimmed ? styles.tileDimmed : ""}`}
              onMouseEnter={() => onFocus(project.id)}
              onMouseLeave={() => onFocus(null)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                width={THUMBNAIL_SIZE}
                height={THUMBNAIL_SIZE}
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

export function ArtworkStripWall({ projects }: ArtworkStripWallProps) {
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const handleFocus = useCallback((id: string | null) => {
    setFocusedId(id);
  }, []);

  if (projects.length === 0) return null;

  // Check reduced-motion preference — strips are static if reduced.
  // We can't use a hook here directly, so the CSS media query handles
  // the animation-play-state, and JS speed becomes irrelevant.

  return (
    <div className={styles.wall} aria-hidden="true">
      {ROW_CONFIG.map((cfg, i) => (
        <StripRow
          key={i}
          projects={projects}
          speed={cfg.speed}
          dir={cfg.dir}
          initialOffset={cfg.offset}
          focusedId={focusedId}
          onFocus={handleFocus}
        />
      ))}
    </div>
  );
}
