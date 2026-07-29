"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ArchivePage } from "@/components/archive/ArchivePage";
import { getArchiveImageUrl } from "@/components/images/cloudinary";
import type { CmsProject } from "@/components/archive/types";
import styles from "./home.module.css";

export interface HomePageProps {
  /** Live CMS projects — the same data the Collection renders. */
  projects?: CmsProject[];
}

// Inspection-light geometry (elliptical + feathered).
const LIGHT_RX = 210;
const LIGHT_RY = 165;
const EASE = 0.16; // inertia — lower feels heavier

function buildMask(x: number, y: number): string {
  // A soft, slightly elliptical hole: fully clear at the centre, feathering
  // out to opaque paper. `transparent` hides the sheet (revealing the
  // Collection); the solid colour keeps it in place.
  return (
    `radial-gradient(${LIGHT_RX}px ${LIGHT_RY}px at ${x}px ${y}px,` +
    ` transparent 0%, transparent 32%,` +
    ` rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.85) 72%, #000 88%)`
  );
}

export default function HomePage({ projects = [] }: HomePageProps) {
  const router = useRouter();
  const paperRef = useRef<HTMLDivElement>(null);

  const target = useRef({ x: -9999, y: -9999 });
  const current = useRef({ x: -9999, y: -9999 });
  const primed = useRef(false); // has the pointer entered at least once
  const rafRef = useRef<number>(0);
  const revealingRef = useRef(false);
  const reducedRef = useRef(false);

  // ── Preload everything the Collection needs so the reveal hides loading ──
  useEffect(() => {
    router.prefetch("/collection");

    const covers = projects
      .map((p) => p.frontCover)
      .filter(Boolean)
      .slice(0, 10);
    for (const cover of covers) {
      const img = new Image();
      img.decoding = "async";
      img.src = getArchiveImageUrl(cover);
    }
  }, [router, projects]);

  // ── Inspection-light animation loop (skipped for reduced motion) ──
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    reducedRef.current = !!reduce;
    if (reduce) return;

    const paper = paperRef.current;
    if (!paper) return;

    const tick = () => {
      if (!revealingRef.current && primed.current) {
        current.current.x += (target.current.x - current.current.x) * EASE;
        current.current.y += (target.current.y - current.current.y) * EASE;
        const mask = buildMask(current.current.x, current.current.y);
        paper.style.webkitMaskImage = mask;
        paper.style.maskImage = mask;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const setTargetFromPoint = useCallback((x: number, y: number) => {
    if (reducedRef.current || revealingRef.current) return;
    target.current = { x, y };
    if (!primed.current) {
      // Snap on first contact so the light doesn't sweep in from the corner.
      current.current = { x, y };
      primed.current = true;
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => setTargetFromPoint(e.clientX, e.clientY),
    [setTargetFromPoint]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0];
      if (t) setTargetFromPoint(t.clientX, t.clientY);
    },
    [setTargetFromPoint]
  );

  const reveal = useCallback(() => {
    if (revealingRef.current) return;
    revealingRef.current = true;

    const paper = paperRef.current;
    if (!paper) {
      router.push("/collection");
      return;
    }

    // Drop the inspection hole so the sheet lifts as one solid piece.
    paper.style.webkitMaskImage = "none";
    paper.style.maskImage = "none";

    if (reducedRef.current) {
      paper.classList.add(styles.paperLiftReduced);
      window.setTimeout(() => router.push("/collection"), 420);
      return;
    }

    paper.classList.add(styles.paperLift);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.push("/collection");
    };
    paper.addEventListener("transitionend", go, { once: true });
    // Safety net in case transitionend doesn't fire.
    window.setTimeout(go, 1150);
  }, [router]);

  return (
    <div className={styles.root}>
      {/* The real, live, CMS-driven Collection sits underneath. */}
      <div className={styles.collectionLayer} aria-hidden="true">
        <ArchivePage projects={projects} />
      </div>

      {/* The archival drafting sheet laid over the Collection. */}
      <div
        ref={paperRef}
        className={styles.paper}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={reveal}
        role="button"
        tabIndex={0}
        aria-label="Lift the sheet to enter the ARTBYDANI7 collection"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            reveal();
          }
        }}
      >
        <div className={styles.wordmarkWrap}>
          <h1 className={styles.wordmark}>ARTBYDANI7</h1>
        </div>
        <p className={styles.hint}>Lift the sheet</p>
        <div className={styles.curl} aria-hidden="true" />
      </div>
    </div>
  );
}
