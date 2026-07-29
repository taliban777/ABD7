import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import styles from "./index-page.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";
import {
  asArray,
  catalogueNumber,
  projectSlug,
  valueLabel,
  SORT_OPTIONS,
  SortKey,
} from "@/components/archive/types";
import { sortProjects } from "@/components/archive/logic/sortProjects";
import { filterProjects } from "@/components/archive/logic/filterProjects";
import { getArchiveImageUrl } from "@/components/images/cloudinary";
import { EMPTY_SELECTION } from "@/components/archive/types";

export interface IndexPageProps {
  projects?: CmsProject[];
}

interface ThumbnailState {
  src: string;
  x: number;
  y: number;
  visible: boolean;
}

const THUMB_W = 180;
const THUMB_H = 180;

export function IndexPage({ projects = [] }: IndexPageProps) {
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [thumb, setThumb] = useState<ThumbnailState>({ src: "", x: 0, y: 0, visible: false });
  const thumbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable catalogue numbers, chronological
  const catalogueMap = useMemo(() => {
    const chronological = sortProjects(safeProjects, "oldest");
    const map = new Map<string, string>();
    chronological.forEach((project, i) => map.set(project.id, catalogueNumber(i)));
    return map;
  }, [safeProjects]);

  const results = useMemo(
    () =>
      sortProjects(
        filterProjects(safeProjects, { search, selected: EMPTY_SELECTION }),
        sort
      ),
    [safeProjects, search, sort]
  );

  const handleMouseEnter = useCallback((project: CmsProject, e: React.MouseEvent) => {
    if (thumbTimer.current) clearTimeout(thumbTimer.current);
    const src = getArchiveImageUrl(project.frontCover);
    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setThumb({
      src,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setThumb((prev) =>
      prev.visible ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top } : prev
    );
  }, []);

  const handleMouseLeave = useCallback(() => {
    thumbTimer.current = setTimeout(() => {
      setThumb((prev) => ({ ...prev, visible: false }));
    }, 60);
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => { if (thumbTimer.current) clearTimeout(thumbTimer.current); }, []);

  // Compute floating thumbnail position clamped inside viewport
  const thumbStyle = useMemo(() => {
    const offset = 18;
    let x = thumb.x + offset;
    let y = thumb.y + offset;

    // If we have the container dimensions, clamp so thumbnail doesn't overflow
    if (containerRef.current) {
      const cw = containerRef.current.offsetWidth;
      const ch = containerRef.current.offsetHeight;
      if (x + THUMB_W > cw) x = thumb.x - THUMB_W - offset;
      if (y + THUMB_H > ch) y = thumb.y - THUMB_H - offset;
    }
    return { left: x, top: y };
  }, [thumb.x, thumb.y]);

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Newest";

  return (
    <>
      <GlobalNav projects={safeProjects} />
      <main className={styles.page}>
        {/* Page header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>INDEX</h1>
          <p className={styles.pageSubtitle}>
            {safeProjects.length} {safeProjects.length === 1 ? "Project" : "Projects"} in Archive
          </p>
        </header>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <label className={styles.searchLabel}>
            <span className={styles.srOnly}>Search archive</span>
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search title, artist, year, category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </label>

          <div className={styles.sortControls} role="group" aria-label="Sort index">
            <span className={styles.sortLabel}>Sort</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={`${styles.sortBtn} ${sort === opt.key ? styles.sortBtnActive : ""}`}
                aria-pressed={sort === opt.key}
                onClick={() => setSort(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div
          ref={containerRef}
          className={styles.tableWrapper}
          onMouseMove={handleMouseMove}
        >
          {/* Column headers */}
          <div className={styles.tableHead} role="row" aria-label="Column headers">
            <span className={styles.colCatalogue}>CATALOGUE</span>
            <span className={styles.colTitle}>TITLE</span>
            <span className={styles.colArtist}>ARTIST</span>
            <span className={styles.colYear}>YEAR</span>
          </div>

          {/* Rows */}
          {results.length === 0 ? (
            <p className={styles.empty}>
              No projects match&nbsp;
              <button
                type="button"
                className={styles.emptyReset}
                onClick={() => setSearch("")}
              >
                Reset
              </button>
            </p>
          ) : (
            <ul className={styles.tableBody} role="list">
              {results.map((project) => {
                const cat = catalogueMap.get(project.id) ?? "";
                const slug = projectSlug(project);
                const primaryArtist = asArray(project.artists)
                  .map(valueLabel)
                  .filter(Boolean)[0] ?? "—";

                return (
                  <li key={project.id} className={styles.tableRow} role="row">
                    <Link
                      href={`/projects/${slug}`}
                      className={styles.rowLink}
                      onMouseEnter={(e) => handleMouseEnter(project, e)}
                      onMouseLeave={handleMouseLeave}
                      tabIndex={0}
                      aria-label={`${project.title} by ${primaryArtist}, ${project.year ?? "—"}`}
                    >
                      <span className={styles.colCatalogue}>
                        {cat ? `No.\u00A0${cat}` : "—"}
                      </span>
                      <span className={styles.colTitle}>{project.title}</span>
                      <span className={styles.colArtist}>{primaryArtist}</span>
                      <span className={styles.colYear}>{project.year ?? "—"}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Floating thumbnail */}
          {thumb.visible && thumb.src && (
            <div
              className={`${styles.floatingThumb} ${thumb.visible ? styles.floatingThumbVisible : ""}`}
              style={thumbStyle}
              aria-hidden="true"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb.src}
                alt=""
                className={styles.floatingThumbImg}
                width={THUMB_W}
                height={THUMB_H}
                loading="eager"
                decoding="async"
              />
            </div>
          )}
        </div>

        {/* Footer row count */}
        <div className={styles.tableFooter}>
          <span>
            {results.length} of {safeProjects.length} {safeProjects.length === 1 ? "entry" : "entries"}
            {search ? ` matching "${search}"` : ""}
          </span>
          <span>Sorted {sortLabel}</span>
        </div>
      </main>
    </>
  );
}
