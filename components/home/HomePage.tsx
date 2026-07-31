"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useRouter } from "next/router";
import styles from "./home.module.css";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

interface SimpleProject {
  id: string;
  title: string;
  frontCover: string;
}

// Number of rows and items per row
const STRIP_ROWS = 6;
const ITEMS_PER_ROW = 24;

interface HoverState {
  projectId: string | null;
  rowIndex: number | null;
}

export default function HomePage() {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);
  const transitioningRef = useRef(false);
  const [projects, setProjects] = useState<SimpleProject[]>([]);
  const [hover, setHover] = useState<HoverState>({ projectId: null, rowIndex: null });
  const [loading, setLoading] = useState(true);

  // Fetch projects from CMS on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch("/api/projects");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        if (data && data.length > 0) {
          setProjects(data);
        } else {
          throw new Error("No projects returned");
        }
      } catch (error) {
        console.error("[v0] Failed to fetch projects from CMS, using placeholders:", error);
        // Use solid color placeholders for visual testing
        const placeholders: SimpleProject[] = Array.from({ length: 144 }, (_, i) => {
          const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F"];
          const color = colors[i % colors.length];
          return {
            id: `placeholder-${i}`,
            title: `Project ${i + 1}`,
            frontCover: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='700' height='700'%3E%3Crect fill='${encodeURIComponent(color)}' width='700' height='700'/%3E%3C/svg%3E`,
          };
        });
        setProjects(placeholders);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Generate rows of projects with different offsets
  const strips = useCallback(() => {
    const rows: SimpleProject[][] = [];
    for (let i = 0; i < STRIP_ROWS; i++) {
      const start = (i * ITEMS_PER_ROW) % projects.length;
      const row: SimpleProject[] = [];
      for (let j = 0; j < ITEMS_PER_ROW; j++) {
        const idx = (start + j) % projects.length;
        row.push(projects[idx]);
      }
      rows.push(row);
    }
    return rows;
  }, [projects]);

  const handleEnter = useCallback(() => {
    if (transitioningRef.current) return;
    transitioningRef.current = true;

    const overlay = overlayRef.current;
    if (!overlay) {
      router.push("/test");
      return;
    }

    overlay.classList.add(styles.overlaySlideUp);

    const tid = setTimeout(() => {
      router.push("/test");
    }, 820);

    return () => clearTimeout(tid);
  }, [router]);

  const stripRows = loading || projects.length === 0 ? [] : strips();

  return (
    <main className={styles.root} aria-label="ARTBYDANI7 — Enter the Archive">
      {/* Artwork strips background */}
      <div className={styles.stripsContainer} aria-hidden="true">
        {stripRows.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={styles.strip}
            style={
              {
                "--row-index": rowIdx,
                "--drift-direction": rowIdx % 2 === 0 ? -1 : 1,
              } as React.CSSProperties
            }
            onMouseLeave={() => setHover({ projectId: null, rowIndex: null })}
          >
            {row.map((project, itemIdx) => {
              if (!project || !project.id) return null;
              return (
                <div
                  key={`${rowIdx}-${itemIdx}-${project.id}`}
                  className={`${styles.stripItem} ${
                    hover.projectId === project.id ? styles.stripItemHover : ""
                  } ${hover.projectId !== null && hover.projectId !== project.id ? styles.stripItemDimmed : ""}`}
                  onMouseEnter={() => setHover({ projectId: project.id, rowIndex: rowIdx })}
                  style={{
                    "--hover-state": hover.projectId === project.id ? "1" : "0",
                  } as React.CSSProperties}
                >
                  <img
                    src={getArchiveImageUrl(project.frontCover)}
                    alt={project.title}
                    className={styles.stripImage}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Dimming overlay when hovering */}
      {hover.projectId !== null && (
        <div className={styles.hoverDim} aria-hidden="true" />
      )}

      {/* Centre content — always on top */}
      <div className={styles.centre}>
        <h1 className={styles.wordmark}>ARTBYDANI7</h1>
        <button
          type="button"
          className={styles.enterBtn}
          onClick={handleEnter}
          aria-label="Enter the collection"
        >
          ENTER COLLECTION
        </button>
      </div>

      {/* Transition overlay */}
      <div ref={overlayRef} className={styles.overlay} aria-hidden="true" />
    </main>
  );
}
