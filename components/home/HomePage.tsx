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

// Glitch reveal: create fragmented reveal with dynamic bands
function buildGlitchMask(x: number, y: number, time: number): string {
  // Build a more visible glitch using simpler gradients but more contrast
  const centerY = y;
  const glitchShift = Math.sin(time * 0.003) * 40;
  
  // Main central reveal band that's always visible
  const main = `linear-gradient(90deg, #000 0%, #000 ${Math.max(0, x - 280)}px, transparent ${Math.max(0, x - 100)}px, transparent ${Math.max(0, x + 100)}px, #000 ${Math.max(0, x + 280)}px, #000 100%)`;
  
  // Top glitch band
  const topBand = `linear-gradient(180deg, #000 0%, #000 ${Math.max(0, centerY - 200 + glitchShift)}px, transparent ${Math.max(0, centerY - 180 + glitchShift)}px, transparent ${Math.max(0, centerY - 160 + glitchShift)}px, #000 ${Math.max(0, centerY - 150 + glitchShift)}px)`;
  
  // Bottom glitch band
  const bottomBand = `linear-gradient(180deg, #000 0%, #000 ${Math.max(0, centerY + 180 - glitchShift)}px, transparent ${Math.max(0, centerY + 200 - glitchShift)}px, transparent ${Math.max(0, centerY + 220 - glitchShift)}px, #000 ${Math.max(0, centerY + 240 - glitchShift)}px)`;
  
  // Left glitch strip
  const leftStrip = `linear-gradient(90deg, #000 0%, #000 ${Math.max(0, x - 180 + Math.sin(time * 0.004) * 30)}px, transparent ${Math.max(0, x - 140 + Math.sin(time * 0.004) * 30)}px, transparent ${Math.max(0, x - 120 + Math.sin(time * 0.004) * 30)}px, #000 ${Math.max(0, x - 100 + Math.sin(time * 0.004) * 30)}px)`;
  
  // Right glitch strip
  const rightStrip = `linear-gradient(90deg, #000 0%, #000 ${Math.max(0, x + 100 + Math.cos(time * 0.0035) * 35)}px, transparent ${Math.max(0, x + 120 + Math.cos(time * 0.0035) * 35)}px, transparent ${Math.max(0, x + 140 + Math.cos(time * 0.0035) * 35)}px, #000 ${Math.max(0, x + 180 + Math.cos(time * 0.0035) * 35)}px)`;
  
  // Random scanlines that pulse
  const scanPhase = Math.sin(time * 0.005);
  const scan1 = `linear-gradient(180deg, #000 0%, #000 ${Math.max(0, centerY - 100 + scanPhase * 25)}px, rgba(0,0,0,${0.4 + scanPhase * 0.4}) ${Math.max(0, centerY - 85 + scanPhase * 25)}px, rgba(0,0,0,${0.4 + scanPhase * 0.4}) ${Math.max(0, centerY - 70 + scanPhase * 25)}px, #000 ${Math.max(0, centerY - 65 + scanPhase * 25)}px)`;
  const scan2 = `linear-gradient(180deg, #000 0%, #000 ${Math.max(0, centerY + 70 - scanPhase * 30)}px, rgba(0,0,0,${0.5 + scanPhase * 0.3}) ${Math.max(0, centerY + 85 - scanPhase * 30)}px, rgba(0,0,0,${0.5 + scanPhase * 0.3}) ${Math.max(0, centerY + 100 - scanPhase * 30)}px, #000 ${Math.max(0, centerY + 110 - scanPhase * 30)}px)`;
  
  // Pulse from center
  const pulseRadius = 120 + Math.sin(time * 0.004) * 50;
  const pulseX = x + Math.sin(time * 0.0025) * 30;
  const pulse = `radial-gradient(circle ${pulseRadius}px at ${pulseX}px ${centerY}px, transparent 0%, transparent 40%, rgba(0,0,0,0.6) 60%, #000 85%)`;

  return [main, topBand, bottomBand, leftStrip, rightStrip, scan1, scan2, pulse].join(", ");
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
  const startTimeRef = useRef(Date.now());

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

  // ── Glitch animation loop (skipped for reduced motion) ──
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
        const time = Date.now() - startTimeRef.current;
        // Gentle drift toward cursor with jitter
        const targetX = target.current.x + (Math.sin(time * 0.004) * 12 - 6);
        const targetY = target.current.y + (Math.cos(time * 0.003) * 10 - 5);
        current.current.x += (targetX - current.current.x) * 0.08;
        current.current.y += (targetY - current.current.y) * 0.08;
        const mask = buildGlitchMask(current.current.x, current.current.y, time);
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
      // Add glitch animation on first interaction
      const paper = paperRef.current;
      if (paper) {
        paper.classList.add(styles.glitching);
      }
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
        <div className={styles.glitchOverlay} aria-hidden="true" />
      </div>
    </div>
  );
}
