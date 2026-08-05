import { useMemo, useState } from "react";
import styles from "./others.module.css";
import { OthersCard } from "./OthersCard";
import { ObiPackCard } from "./ObiPackCard";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { fetchCmsOthers } from "@/lib/cms";
import type { CmsOther } from "./types";
import type { CmsProject } from "@/components/archive/types";
import { projectLabel } from "./types";

export interface OthersPageProps {
  items: CmsOther[];
  projects?: CmsProject[];
}

const isObiStrip = (item: CmsOther) =>
  (item.layoutType === "obi-pack") ||
  (item.type || "").toLowerCase().includes("obi");

const isWide = (item: CmsOther) => {
  if (item.layoutType === "wide") return true;
  const t = (item.type || "").toLowerCase();
  return (
    t.includes("banner") ||
    t.includes("horizontal") ||
    t.includes("landscape") ||
    t.includes("wide")
  );
};

type GridTile =
  | { kind: "card"; item: CmsOther; wide: boolean }
  | { kind: "obi-pack"; items: CmsOther[] };

function buildGridTiles(items: CmsOther[]): GridTile[] {
  const OBI_PACK_SIZE = 3;
  const tiles: GridTile[] = [];
  const pendingObis: CmsOther[] = [];

  const flushObis = () => {
    if (pendingObis.length === 0) return;
    for (let i = 0; i < pendingObis.length; i += OBI_PACK_SIZE) {
      tiles.push({ kind: "obi-pack", items: pendingObis.slice(i, i + OBI_PACK_SIZE) });
    }
    pendingObis.splice(0);
  };

  for (const item of items) {
    if (isObiStrip(item)) {
      pendingObis.push(item);
      if (pendingObis.length >= OBI_PACK_SIZE) flushObis();
    } else {
      flushObis();
      tiles.push({ kind: "card", item, wide: isWide(item) });
    }
  }
  flushObis();
  return tiles;
}

export function OthersPage({ items, projects = [] }: OthersPageProps) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  // Derive unique types from CMS data, sorted by count descending
  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of safeItems) {
      if (item.type) counts.set(item.type, (counts.get(item.type) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count }));
  }, [safeItems]);

  const [activeType, setActiveType] = useState<string | null>(null);

  // null = nothing selected → show nothing until user picks a type
  const filtered = useMemo(() => {
    if (!activeType) return [];
    return safeItems.filter((item) => item.type === activeType);
  }, [safeItems, activeType]);

  const gridTiles = useMemo(() => buildGridTiles(filtered), [filtered]);

  const hasItems = safeItems.length > 0;

  return (
    <>
      <GlobalNav projects={projects} />
      <main className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.pageTitle}>OTHERS</h1>
          <p className={styles.pageSubtitle}>
            {safeItems.length} {safeItems.length === 1 ? "Entry" : "Entries"} in Archive
          </p>
        </header>

        {/* Type filter buttons */}
        {typeOptions.length > 0 && (
          <nav className={styles.typeNav} aria-label="Filter by type">
            {typeOptions.map(({ value, count }, i) => (
              <button
                key={value}
                className={`${styles.typeBtn} ${activeType === value ? styles.typeBtnActive : ""}`}
                type="button"
                style={{ "--btn-index": i } as React.CSSProperties}
                onClick={() => setActiveType((prev) => (prev === value ? null : value))}
              >
                {value}
                <span className={styles.typeBtnCount}>{count}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Grid */}
        {!hasItems ? (
          <p className={styles.empty}>
            The archive is currently empty. New entries will appear here as they are added.
          </p>
        ) : !activeType ? (
          <p className={styles.emptyPrompt}>Select a category above to browse the archive.</p>
        ) : filtered.length === 0 ? (
          <p className={styles.empty}>No entries found for this type.</p>
        ) : (
          <section
            className={styles.unifiedGrid}
            aria-live="polite"
            aria-label="Others collection"
          >
            {gridTiles.map((tile, i) =>
              tile.kind === "obi-pack" ? (
                <ObiPackCard key={`obi-pack-${i}`} items={tile.items} />
              ) : (
                <OthersCard key={tile.item.id} item={tile.item} wide={tile.wide} />
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
