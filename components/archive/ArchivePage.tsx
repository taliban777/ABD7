import { useMemo, useState } from "react";
import { ArchiveGrid } from "./ArchiveGrid";
import { ArchiveToolbar } from "./ArchiveToolbar";
import styles from "./archive.module.css";
import { extractFilterOptions } from "./logic/extractFilterOptions";
import { filterProjects } from "./logic/filterProjects";
import { sortProjects } from "./logic/sortProjects";
import {
  ArchiveFilterKey,
  ArchiveSelection,
  CmsProject,
  EMPTY_SELECTION,
  SORT_OPTIONS,
  SortKey,
  catalogueNumber,
  projectSlug,
} from "./types";
import { GlobalNav } from "@/components/nav/GlobalNav";

export interface ArchivePageProps {
  projects?: CmsProject[];
  /** Optional year pre-filter passed from the PROJECTS nav dropdown. */
  initialYear?: string | null;
}

type ViewMode = "grid" | "list";

// Grid view icon
function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// List view icon
function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <line x1="1" y1="3" x2="13" y2="3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="1" y1="11" x2="13" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ArchivePage({ projects = [], initialYear }: ArchivePageProps) {
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArchiveSelection>(() =>
    initialYear
      ? { ...EMPTY_SELECTION, years: [initialYear] }
      : EMPTY_SELECTION
  );
  const [sort, setSort] = useState<SortKey>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Stable catalogue numbers, assigned chronologically (oldest = 001) so a
  // project keeps the same number regardless of the active search/filter/sort.
  const catalogueMap = useMemo(() => {
    const chronological = sortProjects(safeProjects, "oldest");
    const map = new Map<string, string>();
    chronological.forEach((project, index) => map.set(project.id, catalogueNumber(index)));
    return map;
  }, [safeProjects]);

  const options = useMemo(
    () => extractFilterOptions(safeProjects, selected, search),
    [safeProjects, selected, search]
  );

  const results = useMemo(
    () => sortProjects(filterProjects(safeProjects, { search, selected }), sort),
    [safeProjects, search, selected, sort]
  );

  const activeCount = Object.values(selected).reduce((count, values) => count + values.length, 0);
  const isFiltered = activeCount > 0 || search.trim().length > 0;
  const sortLabel = SORT_OPTIONS.find((option) => option.key === sort)?.label ?? "Newest";

  const toggle = (key: ArchiveFilterKey, value: string) =>
    setSelected((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));

  const clear = () => {
    setSelected(EMPTY_SELECTION);
    setSearch("");
  };

  const hasProjects = safeProjects.length > 0;

  return (
    <>
      <GlobalNav projects={safeProjects} />
      <main className={styles.archivePage} aria-label="Artwork archive">

        {/* Sticky toolbar */}
        <ArchiveToolbar
          isOpen={isOpen}
          search={search}
          selected={selected}
          options={options}
          activeCount={activeCount}
          onOpenChange={() => setIsOpen((value) => !value)}
          onSearchChange={setSearch}
          onToggle={toggle}
          onClear={clear}
        />

        {/* Index / sort bar */}
        <div className={styles.index}>
          <strong>
            {results.length} {results.length === 1 ? "Work" : "Works"}
          </strong>

          <div className={styles.sortControls} role="group" aria-label="Sort projects">
            <span className={styles.sortLabel}>Sort</span>
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`${styles.sortButton} ${sort === option.key ? styles.sortButtonActive : ""}`}
                aria-pressed={sort === option.key}
                onClick={() => setSort(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <span className={styles.indexMeta}>
            Showing <b>{isFiltered ? "Filtered" : "All"}</b> · Sorted <b>{sortLabel}</b>
          </span>

          {/* View mode toggle */}
          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "grid" ? styles.viewToggleBtnActive : ""}`}
              aria-pressed={viewMode === "grid"}
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
            >
              <GridIcon />
            </button>
            <button
              type="button"
              className={`${styles.viewToggleBtn} ${viewMode === "list" ? styles.viewToggleBtnActive : ""}`}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
              onClick={() => setViewMode("list")}
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className={styles.gridWrapper}>
          {!hasProjects ? (
            <p className={styles.empty}>
              The archive is currently empty. New works will appear here as they are added.
            </p>
          ) : results.length === 0 ? (
            <p className={styles.empty}>
              No works match this query.
              {isFiltered ? (
                <button type="button" className={styles.emptyReset} onClick={clear}>
                  Reset
                </button>
              ) : null}
            </p>
          ) : (
            <ArchiveGrid
              projects={results}
              viewMode={viewMode}
              catalogueFor={(project) => catalogueMap.get(project.id) ?? ""}
              hrefFor={(project) => `/projects/${projectSlug(project)}`}
            />
          )}
        </div>

      </main>
    </>
  );
}
