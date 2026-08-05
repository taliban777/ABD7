"use client";

/**
 * Exhibition 01 — Can You See the Colour?
 *
 * All artwork drifts slowly left in a continuous marquee.
 * Scrolling increases speed; coming to rest eases it back.
 * All images are desaturated (CSS only) to reinforce the concept.
 *
 * Technique: same CSS keyframe approach as ArtworkStripWall.
 * Speed modulation: scroll listener sets --marquee-duration on the track,
 * CSS transition on animation-duration handles smooth ease.
 */

import { useEffect, useRef, useMemo } from "react";
import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

// Tile height in px — makes the marquee feel monumental
const TILE_HEIGHT = 520;
// Copies duplicated to ensure seamless loop
const COPIES = 4;
// Base drift speed (px/s) — calm, continuous
const BASE_SPEED = 45;
// Accelerated speed when scrolling
const FAST_SPEED = 180;
// Debounce ms — how long after scroll stops before slowing back down
const SCROLL_DEBOUNCE = 450;

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout01({ exhibition }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build track tiles: duplicate works COPIES times for seamless loop
  const tiles = useMemo(() => {
    const base = exhibition.works;
    if (base.length === 0) return [];
    const result = [];
    for (let i = 0; i < COPIES; i++) result.push(...base);
    return result;
  }, [exhibition.works]);

  // loopWidth = one copy-set's total width.
  // Each image is rendered at natural width with fixed height, so we
  // approximate tile width as (height * 0.75) — portrait default.
  // The animation uses a % approach instead to avoid needing exact widths.
  // We set --marquee-loop-width as 100% / COPIES of the total track width.
  const setSpeed = (px_per_sec: number) => {
    const track = trackRef.current;
    if (!track) return;
    // Estimate total track px from rendered offsetWidth if available
    const trackWidth = track.scrollWidth || 1;
    const loopWidth = trackWidth / COPIES;
    const duration = loopWidth / px_per_sec;
    track.style.setProperty("--marquee-duration", `${duration}s`);
    track.style.setProperty("--marquee-loop-width", `${loopWidth}px`);
  };

  // On mount: set initial speed after layout
  useEffect(() => {
    // Wait one frame so scrollWidth is populated
    const raf = requestAnimationFrame(() => setSpeed(BASE_SPEED));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  // Scroll listener: accelerate on scroll, decelerate after stop
  useEffect(() => {
    const onScroll = () => {
      setSpeed(FAST_SPEED);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      slowTimerRef.current = setTimeout(() => setSpeed(BASE_SPEED), SCROLL_DEBOUNCE);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  if (tiles.length === 0) return null;

  return (
    <section className={styles.marqueeSection} aria-label={`Artworks from ${exhibition.title}`}>
      <div
        ref={trackRef}
        className={styles.marqueeTrack}
        aria-hidden="true"
      >
        {tiles.map((work, idx) => {
          const src = getProjectImageUrl(work.frontCover);
          return (
            <div key={`${work.id}-${idx}`} className={styles.marqueeTile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={idx < exhibition.works.length ? work.title : ""}
                height={TILE_HEIGHT}
                loading={idx < exhibition.works.length * 2 ? "eager" : "lazy"}
                decoding="async"
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
