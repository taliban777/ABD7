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

export interface ArchivePageProps {
  projects?: CmsProject[];
}

export function ArchivePage({ projects = [] }: ArchivePageProps) {
  const safeProjects = useMemo(() => (Array.isArray(projects) ? projects : []), [projects]);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArchiveSelection>(EMPTY_SELECTION);
  const [sort, setSort] = useState<SortKey>("newest");

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
    <main className={styles.archivePage}>
      <header className={styles.siteHeader}>
        <a href="/" className={styles.wordmark}>
          ARTBYDANI7
        </a>
        <span>Archive Control Centre</span>
      </header>

      <div className={styles.intro}>
        <p>Independent art direction and visual archive</p>
        <h1>Archive</h1>
      </div>

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

      <div className={styles.index}>
        <strong>
          {results.length} {results.length === 1 ? "Project" : "Projects"}
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
      </div>

      {!hasProjects ? (
        <p className={styles.empty}>The archive is currently empty. New projects will appear here as they are added.</p>
      ) : results.length === 0 ? (
        <p className={styles.empty}>
          No projects match this archive query.
          {isFiltered ? (
            <button type="button" className={styles.emptyReset} onClick={clear}>
              Reset
            </button>
          ) : null}
        </p>
      ) : (
        <ArchiveGrid
          projects={results}
          catalogueFor={(project) => catalogueMap.get(project.id) ?? ""}
          hrefFor={(project) => `/projects/${projectSlug(project)}`}
        />
      )}
    </main>
  );
}
