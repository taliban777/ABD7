import { useMemo } from "react";
import styles from "./colophon.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";
import { asArray, paletteValue, valueLabel } from "@/components/archive/types";
import { sortProjects } from "@/components/archive/logic/sortProjects";

export interface ColophonPageProps {
  projects?: CmsProject[];
  /** ISO string of last CMS update — passed from getServerSideProps. */
  lastUpdated?: string | null;
}

// ─── Colour grouping (mirrors archive logic) ─────────────────────────────────

function categorizeHex(hex: string): string {
  if (!hex) return "neutral";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "neutral";
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const c = max - min;
  const s = c === 0 ? 0 : c / (1 - Math.abs(2 * l - 1));
  let hue = 0;
  if (c !== 0) {
    if (max === r) hue = (((g - b) / c) % 6 + 6) % 6;
    else if (max === g) hue = (b - r) / c + 2;
    else hue = (r - g) / c + 4;
  }
  hue *= 60;
  const lightness = l * 100;
  if (lightness < 25) return "Dark";
  if (lightness > 85 && s < 0.15) return "Neutral";
  if (s < 0.15) return "Neutral";
  if (hue < 15 || hue >= 345) return "Red / Pink";
  if (hue >= 15 && hue < 45) return lightness < 50 ? "Warm Earth" : "Gold / Yellow";
  if (hue >= 45 && hue < 75) return "Gold / Yellow";
  if (hue >= 75 && hue < 165) return "Green";
  if (hue >= 165 && hue < 255) return "Blue";
  if (hue >= 255 && hue < 295) return "Purple";
  if (hue >= 295 && hue < 345) return "Red / Pink";
  return "Neutral";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

// ─── Row / Table primitives ───────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr>
      <td className={styles.rowLabel}>{label}</td>
      <td className={styles.rowValue}>{value}</td>
    </tr>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <tr className={styles.sectionHeaderRow}>
      <td colSpan={2} className={styles.sectionHeader}>
        {title}
      </td>
    </tr>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ColophonPage({ projects = [], lastUpdated }: ColophonPageProps) {
  const safeProjects = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects]
  );

  // ── Statistics derived from CMS data ────────────────────────────────────────

  const stats = useMemo(() => {
    const total = safeProjects.length;

    // Unique artists
    const artistSet = new Set<string>();
    for (const p of safeProjects) {
      for (const a of asArray(p.artists)) {
        const label = valueLabel(a);
        if (label) artistSet.add(label);
      }
    }

    // Unique years
    const yearSet = new Set<number>();
    for (const p of safeProjects) {
      if (typeof p.year === "number" && !isNaN(p.year)) yearSet.add(p.year);
    }
    const years = Array.from(yearSet).sort((a, b) => a - b);

    // Unique categories
    const catSet = new Set<string>();
    for (const p of safeProjects) {
      for (const c of asArray(p.categories)) {
        const label = valueLabel(c);
        if (label) catSet.add(label);
      }
    }

    // Colour family counts
    const colourMap = new Map<string, number>();
    let totalSwatches = 0;
    for (const p of safeProjects) {
      for (const sw of asArray(p.palette)) {
        const hex = paletteValue(sw);
        if (hex) {
          const family = categorizeHex(hex);
          colourMap.set(family, (colourMap.get(family) ?? 0) + 1);
          totalSwatches++;
        }
      }
    }

    // Most common colour family
    let dominantFamily = "—";
    let dominantCount = 0;
    for (const [family, count] of colourMap.entries()) {
      if (count > dominantCount) {
        dominantFamily = family;
        dominantCount = count;
      }
    }

    // Colour families sorted by prevalence
    const colourFamilies = Array.from(colourMap.entries()).sort(
      ([, a], [, b]) => b - a
    );

    // Newest / oldest
    const byOldest = sortProjects(safeProjects, "oldest");
    const oldest = byOldest[0] ?? null;
    const newest = byOldest[byOldest.length - 1] ?? null;

    // Average palette size
    const avgPalette =
      total > 0
        ? (
            safeProjects.reduce(
              (sum, p) => sum + asArray(p.palette).length,
              0
            ) / total
          ).toFixed(1)
        : "—";

    return {
      total,
      artists: artistSet.size,
      years: years.length,
      yearRange:
        years.length >= 2
          ? `${years[0]} – ${years[years.length - 1]}`
          : years[0]?.toString() ?? "—",
      categories: catSet.size,
      colours: totalSwatches,
      dominantFamily,
      colourFamilies,
      oldest,
      newest,
      avgPalette,
    };
  }, [safeProjects]);

  return (
    <>
      <GlobalNav projects={safeProjects} />
      <main className={styles.page}>
        {/* Page header */}
        <header className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>COLOPHON</h1>
          <p className={styles.pageSubtitle}>
            Technical notes and archive statistics for ARTBYDANI7.
          </p>
        </header>



        {/* Single unified table */}
        <div className={styles.tableContainer}>
          <table className={styles.table} cellSpacing={0}>
            <tbody>

              {/* ── Release Statistics ── */}
              <SectionHeader title="Release Statistics" />
              <Row label="Total Projects" value={stats.total} />
              <Row label="Unique Artists" value={stats.artists} />
              <Row label="Year Span" value={stats.yearRange} />
              <Row label="Years Active" value={stats.years} />
              <Row label="Category Types" value={stats.categories} />
              <Row
                label="Newest Project"
                value={
                  stats.newest ? (
                    <>
                      {stats.newest.title}
                      {stats.newest.year ? ` (${stats.newest.year})` : ""}
                    </>
                  ) : "—"
                }
              />
              <Row
                label="Oldest Project"
                value={
                  stats.oldest ? (
                    <>
                      {stats.oldest.title}
                      {stats.oldest.year ? ` (${stats.oldest.year})` : ""}
                    </>
                  ) : "—"
                }
              />
              {lastUpdated ? (
                <Row label="Last Updated" value={formatDate(lastUpdated)} />
              ) : null}

            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className={styles.colophonFooter}>
          <p>
            All content copyright ARTBYDANI7. Archive statistics generated at
            build time from CMS data.
          </p>
        </footer>
      </main>
    </>
  );
}
