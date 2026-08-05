"use client";

/**
 * Exhibition 01 — Can You See the Colour?
 *
 * All artwork drifts slowly left in a continuous marquee.
 * Scrolling increases speed; coming to rest eases it back.
 * All images are desaturated (CSS only) to reinforce the concept.
 */

import { useEffect, useRef, useMemo } from "react";
import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

const TILE_HEIGHT = 520;
const COPIES = 4;
const BASE_SPEED = 45;
const FAST_SPEED = 180;
const SCROLL_DEBOUNCE = 450;

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout01({ exhibition }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tiles = useMemo(() => {
    const base = exhibition.works;
    if (base.length === 0) return [];
    const result = [];
    for (let i = 0; i < COPIES; i++) result.push(...base);
    return result;
  }, [exhibition.works]);

  const setSpeed = (px_per_sec: number) => {
    const track = trackRef.current;
    if (!track) return;
    const trackWidth = track.scrollWidth || 1;
    const loopWidth = trackWidth / COPIES;
    const duration = loopWidth / px_per_sec;
    track.style.setProperty("--marquee-duration", `${duration}s`);
    track.style.setProperty("--marquee-loop-width", `${loopWidth}px`);
  };

  useEffect(() => {
    const raf = requestAnimationFrame(() => setSpeed(BASE_SPEED));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

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
      <div ref={trackRef} className={styles.marqueeTrack} aria-hidden="true">
        {tiles.map((work, idx) => {
          const src = getProjectImageUrl(work.imageUrl);
          return (
            <div key={`${work.project.id}-${idx}`} className={styles.marqueeTile}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={idx < exhibition.works.length ? work.project.title : ""}
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
