import { useMemo, useState } from "react";
import styles from "./others.module.css";
import { OthersCard } from "./OthersCard";
import { ObiPackCard } from "./ObiPackCard";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { fetchCmsOthers } from "@/lib/cms";
import type { CmsOther, OthersSelection, OthersFilterKey } from "./types";
import {
  EMPTY_OTHERS_SELECTION,
  OTHERS_SORT_OPTIONS,
  OthersSortKey,
  projectLabel,
} from "./types";
import { sortOthers } from "./logic/sortOthers";
import { filterOthers } from "./logic/filterOthers";
import { extractOthersFilterOptions } from "./logic/extractOthersFilterOptions";

export interface OthersPageProps {
  items: CmsOther[];
}

export function OthersPage({ items }: OthersPageProps) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<OthersSelection>(EMPTY_OTHERS_SELECTION);
  const [sort, setSort] = useState<OthersSortKey>("newest");
  const [filterOpen, setFilterOpen] = useState(false);

  const options = useMemo(
    () => extractOthersFilterOptions(safeItems, selected, search),
    [safeItems, selected, search]
  );

  const allResults = useMemo(
    () => sortOthers(filterOthers(safeItems, { search, selected }), sort),
    [safeItems, search, selected, sort]
  );

  /**
   * Resolve the layout type for an item.
   * Explicit `layoutType` on the CMS item wins; otherwise infer from `type`.
   */
  const resolveLayout = (item: CmsOther): "standard" | "wide" | "obi-pack" => {
    if (item.layoutType) return item.layoutType;
    const t = (item.type || "").toLowerCase();
    if (t.includes("obi")) return "obi-pack";
    if (
      t.includes("banner") ||
      t.includes("horizontal") ||
      t.includes("landscape") ||
      t.includes("wide")
    ) return "wide";
    return "standard";
  };

  type GridTile =
    | { kind: "card"; item: CmsOther; wide: boolean }
    | { kind: "obi-pack"; items: CmsOther[] };

  const gridTiles = useMemo<GridTile[]>(() => {
    // Show 2 obi strips per pack tile — enough to feel like a shelf grouping
    // without overwhelming a single grid cell.
    const OBI_PACK_SIZE = 2;
    const tiles: GridTile[] = [];
    const pendingObis: CmsOther[] = [];

    /** Drain all pending obis into pack tiles. */
    const flushObis = () => {
      if (pendingObis.length === 0) return;
      for (let i = 0; i < pendingObis.length; i += OBI_PACK_SIZE) {
        tiles.push({ kind: "obi-pack", items: pendingObis.slice(i, i + OBI_PACK_SIZE) });
      }
      pendingObis.splice(0);
    };

    for (const item of allResults) {
      const layout = resolveLayout(item);
      if (layout === "obi-pack") {
        pendingObis.push(item);
        // emit a tile as soon as the pack is full so obis interleave naturally
        if (pendingObis.length >= OBI_PACK_SIZE) flushObis();
      } else {
        // flush any remaining obis before inserting a non-obi card
        flushObis();
        tiles.push({ kind: "card", item, wide: layout === "wide" });
      }
    }
    // flush any trailing obi strips (lone strip becomes a 1-item pack)
    flushObis();
    return tiles;
  }, [allResults]);

  const results = allResults;

  const activeCount =
    selected.types.length + selected.projects.length;
  const isFiltered = activeCount > 0 || search.trim().length > 0;
  const sortLabel =
    OTHERS_SORT_OPTIONS.find((o) => o.key === sort)?.label ?? "Newest";

  const toggle = (key: OthersFilterKey, value: string) =>
    setSelected((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((v) => v !== value)
        : [...current[key], value],
    }));

  const clear = () => {
    setSelected(EMPTY_OTHERS_SELECTION);
    setSearch("");
  };

  const hasItems = safeItems.length > 0;

  return (
    <>
      <GlobalNav projects={[]} />
      <main className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>OTHERS</h1>
          <p className={styles.pageSubtitle}>
            {safeItems.length} {safeItems.length === 1 ? "Entry" : "Entries"} in Archive
          </p>
        </header>

        {/* Toolbar */}
        <section
          className={`${styles.toolbar} ${filterOpen ? styles.toolbarOpen : ""}`}
          aria-label="Others controls"
        >
          <div className={styles.toolbarTop}>
            <label className={styles.searchLabel}>
              <span className={styles.srOnly}>Search others</span>
              <input
                className={styles.searchInput}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, type, tags…"
                autoComplete="off"
                spellCheck={false}
              />
            </label>
            <button
              className={styles.filterToggle}
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              aria-expanded={filterOpen}
              aria-controls="others-filter-panel"
            >
              Filter {activeCount > 0 ? `(${activeCount})` : ""} {filterOpen ? "−" : "+"}
            </button>
          </div>

          {/* Filter panel */}
          <div
            className={styles.filterPanel}
            id="others-filter-panel"
            aria-hidden={!filterOpen}
          >
            <div className={styles.filterPanelInner}>
              <div className={styles.filterGroups}>
                {/* Type filter */}
                <fieldset className={styles.filterGroup}>
                  <legend className={styles.filterLegend}>Type</legend>
                  {options.types.length === 0 ? (
                    <p className={styles.filterEmpty}>None available</p>
                  ) : (
                    <div className={styles.checkList}>
                      {options.types.map((option) => {
                        const isSelected = selected.types.includes(option.value);
                        return (
                          <label className={styles.checkOption} key={option.value}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle("types", option.value)}
                            />
                            <span className={styles.checkBox} aria-hidden="true" />
                            <span className={styles.checkText}>{option.label}</span>
                            <span className={styles.filterCount}>{option.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>

                {/* Project filter */}
                <fieldset className={styles.filterGroup}>
                  <legend className={styles.filterLegend}>Project</legend>
                  {options.projects.length === 0 ? (
                    <p className={styles.filterEmpty}>None available</p>
                  ) : (
                    <div className={styles.checkList}>
                      {options.projects.map((option) => {
                        const isSelected = selected.projects.includes(option.value);
                        return (
                          <label className={styles.checkOption} key={option.value}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggle("projects", option.value)}
                            />
                            <span className={styles.checkBox} aria-hidden="true" />
                            <span className={styles.checkText}>{option.label}</span>
                            <span className={styles.filterCount}>{option.count}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              </div>

              <div className={styles.filterFooter}>
                <button
                  type="button"
                  onClick={clear}
                  disabled={activeCount === 0 && search.length === 0}
                >
                  Clear Filters
                </button>
                <span>
                  {activeCount} {activeCount === 1 ? "Filter" : "Filters"} Selected
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Index / sort bar */}
        <div className={styles.indexBar}>
          <strong>
            {results.length} {results.length === 1 ? "Entry" : "Entries"}
          </strong>
          <div className={styles.sortControls} role="group" aria-label="Sort others">
            <span className={styles.sortLabel}>Sort</span>
            {OTHERS_SORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`${styles.sortButton} ${
                  sort === option.key ? styles.sortButtonActive : ""
                }`}
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

        {/* Content */}
        {!hasItems ? (
          <p className={styles.empty}>
            The archive is currently empty. New entries will appear here as they are added.
          </p>
        ) : results.length === 0 ? (
          <p className={styles.empty}>
            No entries match this query.
            {isFiltered ? (
              <button type="button" className={styles.emptyReset} onClick={clear}>
                Reset
              </button>
            ) : null}
          </p>
        ) : (
          <section
            className={styles.unifiedGrid}
            aria-live="polite"
            aria-label="Others collection"
          >
            {gridTiles.map((tile, i) =>
              tile.kind === "obi-pack" ? (
                <ObiPackCard
                  key={`obi-pack-${i}`}
                  items={tile.items}
                />
              ) : (
                <OthersCard
                  key={tile.item.id}
                  item={tile.item}
                  wide={tile.wide}
                />
              )
            )}
          </section>
        )}
      </main>
    </>
  );
}

// Re-export for convenience
export { fetchCmsOthers };
export { projectLabel };
