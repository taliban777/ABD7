"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
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

  // Prefetch the collection route without competing with navigation for
  // bandwidth by downloading its artwork ahead of time.
  useEffect(() => {
    router.prefetch("/collection");
  }, [router]);

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
    window.setTimeout(go, 650);
  }, [router]);

  return (
    <div className={styles.root}>
      {/* ── Strip wall layer (CMS artwork behind the paper block) ── */}
      <div className={styles.stripLayer}>
        <ArtworkStripWall projects={projects} />
      </div>

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
