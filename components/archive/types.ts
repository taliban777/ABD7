export type CmsListValue = string | { name?: string; title?: string; label?: string; value?: string; color?: string; hex?: string };

export interface CmsProject {
  id: string;
  title: string;
  slug?: string;
  frontCover: string;
  artists: CmsListValue[];
  categories: CmsListValue[];
  style: CmsListValue[];
  palette: CmsListValue[];
  year?: number;
  date?: string;
  createdAt?: string;
}

export interface ArchiveSelection {
  artists: string[];
  categories: string[];
  style: string[];
  years: string[];
  palette: string[];
}

export type ArchiveFilterKey = keyof ArchiveSelection;

/** A single, CMS-derived filter choice with a live result count. */
export interface FilterOption {
  /** Human readable label shown in the UI. */
  label: string;
  /** Canonical value used for selection/matching. */
  value: string;
  /** Number of projects in the current scope that match this option. */
  count: number;
  /** Present only for palette options — the resolved hex/colour value. */
  color?: string;
}

export interface ArchiveFilterOptions {
  artists: FilterOption[];
  categories: FilterOption[];
  style: FilterOption[];
  years: FilterOption[];
  palette: FilterOption[];
}

export type SortKey = "newest" | "oldest" | "az" | "za";

export const SORT_OPTIONS: Array<{ key: SortKey; label: string }> = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
  { key: "az", label: "A–Z" },
  { key: "za", label: "Z–A" },
];

export const EMPTY_SELECTION: ArchiveSelection = { artists: [], categories: [], style: [], years: [], palette: [] };

/** Resolve the display label from a CMS list value that may be a string or object. */
export function valueLabel(value?: CmsListValue | null): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.name || value.title || value.label || value.value || value.color || value.hex || "";
}

/** Resolve the colour/hex from a CMS palette value that may be a string or object. */
export function paletteValue(value?: CmsListValue | null): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value.hex || value.color || value.value || value.name || "";
}

/** Safely coerce a possibly-missing CMS field into an array of list values. */
export function asArray(value?: CmsListValue[] | null): CmsListValue[] {
  return Array.isArray(value) ? value : [];
}

/** Build a stable slug for routing when the CMS slug is missing. */
export function projectSlug(project: Pick<CmsProject, "slug" | "title" | "id">): string {
  if (project.slug) return project.slug;
  const fromTitle = (project.title || "").trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return fromTitle || project.id;
}

/** Format a stable, zero-padded catalogue number, e.g. 7 -> "007". */
export function catalogueNumber(index: number): string {
  return String(index + 1).padStart(3, "0");
}
