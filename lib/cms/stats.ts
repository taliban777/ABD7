/**
 * ============================================================================
 * Derived archive statistics — one reusable calculation layer.
 * ============================================================================
 *
 * Every number shown on Catalogue and Colophon comes from here, computed from
 * the live CMS project list. Nothing is hardcoded and no page performs its own
 * tallying, so importing a new project updates every figure automatically.
 *
 * Safe to import from both server and client code.
 */

import type { CmsProject } from "@/components/archive/types";
import {
  asArray,
  catalogueNumber,
  paletteValue,
  valueLabel,
} from "@/components/archive/types";
import { categorizeHex, type ColourFamily } from "./colour";

// ─── Small shared formatters ────────────────────────────────────────────────

/** Format an ISO date for display, falling back to an em dash. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Compact date for dense table columns, e.g. "04 Mar 2024". */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** The best available release timestamp for a project. */
export function releaseDateOf(project: CmsProject): string | null {
  return project.date ?? project.createdAt ?? null;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CountedValue {
  label: string;
  count: number;
}

export interface ColourFamilyStat {
  family: ColourFamily;
  count: number;
  /** Share of all swatches in the archive, 0–100. */
  percent: number;
}

export interface YearStat {
  year: number;
  count: number;
}

export interface ArchiveStats {
  // Volume
  totalProjects: number;

  // Time
  years: number[];
  yearsActive: number;
  yearRange: string;
  firstYear: number | null;
  latestYear: number | null;
  projectsPerYear: YearStat[];
  averageProjectsPerYear: string;

  // Releases
  firstRelease: CmsProject | null;
  latestRelease: CmsProject | null;
  firstReleaseDate: string | null;
  latestReleaseDate: string | null;

  // People and taxonomy
  artists: CountedValue[];
  totalArtists: number;
  categories: CountedValue[];
  totalCategories: number;
  styles: CountedValue[];
  totalStyles: number;
  /** Projects tagged as a curation — future-proofed for the Curations page. */
  totalCurations: number;

  // Colour
  totalSwatches: number;
  uniqueSwatches: number;
  averageSwatchesPerProject: string;
  colourFamilies: ColourFamilyStat[];
  dominantFamily: string;

  // Catalogue
  catalogueRange: string;
  /** Project id → stable catalogue number, assigned oldest-first. */
  catalogueNumbers: Map<string, string>;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function tally(projects: CmsProject[], field: "artists" | "categories" | "style"): CountedValue[] {
  const counts = new Map<string, number>();
  for (const project of projects) {
    // A project mentioning the same value twice must not inflate the count.
    const unique = new Set<string>();
    for (const raw of asArray(project[field])) {
      const label = valueLabel(raw).trim();
      if (label) unique.add(label);
    }
    for (const label of unique) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return Array.from(counts, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label)
  );
}

/** Chronological ordering used for catalogue numbering and first/latest. */
function chronological(projects: CmsProject[]): CmsProject[] {
  return [...projects].sort((a, b) => {
    const ay = a.year ?? 0;
    const by = b.year ?? 0;
    if (ay !== by) return ay - by;
    const ad = releaseDateOf(a) ?? "";
    const bd = releaseDateOf(b) ?? "";
    return ad.localeCompare(bd);
  });
}

const CURATION_PATTERN = /curation|curated|curator/i;

// ─── Main derivation ────────────────────────────────────────────────────────

/**
 * Derive the complete statistical profile of the archive.
 *
 * Pure and inexpensive — call inside a useMemo keyed on the project list.
 */
export function deriveArchiveStats(input: CmsProject[] | null | undefined): ArchiveStats {
  const projects = Array.isArray(input) ? input : [];
  const totalProjects = projects.length;

  // ── Years ──
  const yearCounts = new Map<number, number>();
  for (const p of projects) {
    if (typeof p.year === "number" && !Number.isNaN(p.year)) {
      yearCounts.set(p.year, (yearCounts.get(p.year) ?? 0) + 1);
    }
  }
  const years = Array.from(yearCounts.keys()).sort((a, b) => a - b);
  const firstYear = years[0] ?? null;
  const latestYear = years[years.length - 1] ?? null;
  const projectsPerYear: YearStat[] = years
    .map((year) => ({ year, count: yearCounts.get(year) ?? 0 }))
    .sort((a, b) => b.year - a.year);

  // Span, not merely the number of distinct years, so a gap year still counts.
  const yearSpan =
    firstYear !== null && latestYear !== null ? latestYear - firstYear + 1 : 0;

  // ── Releases ──
  const ordered = chronological(projects);
  const firstRelease = ordered[0] ?? null;
  const latestRelease = ordered[ordered.length - 1] ?? null;

  // ── Taxonomy ──
  const artists = tally(projects, "artists");
  const categories = tally(projects, "categories");
  const styles = tally(projects, "style");

  const totalCurations = projects.filter((p) =>
    [...asArray(p.categories), ...asArray(p.style)].some((v) =>
      CURATION_PATTERN.test(valueLabel(v))
    )
  ).length;

  // ── Colour ──
  const familyCounts = new Map<ColourFamily, number>();
  const uniqueHexes = new Set<string>();
  let totalSwatches = 0;

  for (const p of projects) {
    for (const swatch of asArray(p.palette)) {
      const hex = paletteValue(swatch).trim();
      if (!hex) continue;
      totalSwatches++;
      uniqueHexes.add(hex.toLowerCase());
      const family = categorizeHex(hex);
      familyCounts.set(family, (familyCounts.get(family) ?? 0) + 1);
    }
  }

  const colourFamilies: ColourFamilyStat[] = Array.from(familyCounts, ([family, count]) => ({
    family,
    count,
    percent: totalSwatches > 0 ? (count / totalSwatches) * 100 : 0,
  })).sort((a, b) => b.count - a.count);

  // ── Catalogue numbers ──
  const catalogueNumbers = new Map<string, string>();
  ordered.forEach((project, index) => {
    catalogueNumbers.set(project.id, catalogueNumber(index));
  });

  return {
    totalProjects,

    years,
    yearsActive: yearSpan,
    yearRange:
      years.length >= 2
        ? `${firstYear} – ${latestYear}`
        : years.length === 1
        ? String(firstYear)
        : "—",
    firstYear,
    latestYear,
    projectsPerYear,
    averageProjectsPerYear:
      yearSpan > 0 ? (totalProjects / yearSpan).toFixed(1) : "—",

    firstRelease,
    latestRelease,
    firstReleaseDate: firstRelease ? releaseDateOf(firstRelease) : null,
    latestReleaseDate: latestRelease ? releaseDateOf(latestRelease) : null,

    artists,
    totalArtists: artists.length,
    categories,
    totalCategories: categories.length,
    styles,
    totalStyles: styles.length,
    totalCurations,

    totalSwatches,
    uniqueSwatches: uniqueHexes.size,
    averageSwatchesPerProject:
      totalProjects > 0 ? (totalSwatches / totalProjects).toFixed(1) : "—",
    colourFamilies,
    dominantFamily: colourFamilies[0]?.family ?? "—",

    catalogueRange:
      totalProjects > 0
        ? `${catalogueNumber(0)} – ${catalogueNumber(totalProjects - 1)}`
        : "—",
    catalogueNumbers,
  };
}

/**
 * Years available for the PROJECTS nav dropdown, newest first.
 * Derived live from the CMS — never hardcoded.
 */
export function deriveYears(input: CmsProject[] | null | undefined): number[] {
  const projects = Array.isArray(input) ? input : [];
  const years = new Set<number>();
  for (const p of projects) {
    if (typeof p.year === "number" && !Number.isNaN(p.year)) years.add(p.year);
  }
  return Array.from(years).sort((a, b) => b - a);
}

/** Projects released in a given year, newest release first. */
export function projectsInYear(
  input: CmsProject[] | null | undefined,
  year: number
): CmsProject[] {
  const projects = Array.isArray(input) ? input : [];
  return projects
    .filter((p) => p.year === year)
    .sort((a, b) => (releaseDateOf(b) ?? "").localeCompare(releaseDateOf(a) ?? ""));
}
