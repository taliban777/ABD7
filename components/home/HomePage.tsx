"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getArchiveImageUrl } from "@/components/images/cloudinary";
import type { CmsProject } from "@/components/archive/types";
import { ArtworkStripWall } from "./ArtworkStripWall";
import styles from "./home.module.css";

export interface HomePageProps {
  projects?: CmsProject[];
}

export default function HomePage({ projects = [] }: HomePageProps) {
  const router = useRouter();
  const panelRef    = useRef<HTMLDivElement>(null);
  const revealingRef = useRef(false);
  const reducedRef  = useRef(false);
  // Suppress the strip wall during SSR — it uses CSS animations that depend
  // on layout, producing a hydration mismatch if rendered server-side.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Prefetch Collection + preload top covers ─────────────────────────
  useEffect(() => {
    router.prefetch("/collection");

    const covers = projects
      .map((p) => p.frontCover)
      .filter(Boolean)
      .slice(0, 12);
    for (const cover of covers) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.decoding = "async";
      img.src = getArchiveImageUrl(cover);
    }
  }, [router, projects]);

  // ── Detect reduced motion once ───────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    reducedRef.current = !!mq?.matches;
  }, []);

  // ── Reveal: panel lifts upward, Collection underneath ───────────────
  const reveal = useCallback(() => {
    if (revealingRef.current) return;
    revealingRef.current = true;

    const panel = panelRef.current;
    if (!panel) {
      router.push("/collection");
      return;
    }

    if (reducedRef.current) {
      panel.classList.add(styles.panelLiftReduced);
      window.setTimeout(() => router.push("/collection"), 420);
      return;
    }

    panel.classList.add(styles.panelLift);
    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      router.push("/collection");
    };
    panel.addEventListener("transitionend", go, { once: true });
    window.setTimeout(go, 1200);
  }, [router]);

  return (
    <div className={styles.root}>
      {/* ── Strip wall layer (CMS artwork behind the paper block) ── */}
      {mounted && (
        <div className={styles.stripLayer}>
          <ArtworkStripWall projects={projects} />
        </div>
      )}

      {/* ── Hero panel (opaque paper block + typography) ─────────── */}
      <div ref={panelRef} className={styles.panel}>
        <div className={styles.paperBlock}>
          <h1 className={styles.title}>ARTBYDANI7</h1>

          <button
            type="button"
            className={styles.enterBtn}
            onClick={reveal}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                reveal();
              }
            }}
            aria-label="Enter the ARTBYDANI7 collection"
          >
            Enter Collection
          </button>
        </div>
      </div>
    </div>
  );
}
