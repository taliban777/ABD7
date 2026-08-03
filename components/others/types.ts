/**
 * Type definitions for the "Others" CMS model.
 * Independent from the Album Archive types — the Others schema has
 * its own fields (type, description, groupSlug, tags, etc.).
 */

export type OthersListValue = string | { name?: string; title?: string; label?: string; value?: string };

export interface CmsOther {
  id: string;
  title: string;
  slug: string;
  date: string | null;
  year?: number | null;
  type: string;
  description: string;
  image: string;
  gallery: string[] | null;
  tags: string[];
  groupSlug: string;
}

export type OthersFilterKey = "types" | "projects";

export interface OthersSelection {
  types: string[];
  projects: string[];
}

export interface OthersFilterOption {
  label: string;
  value: string;
  count: number;
}

export interface OthersFilterOptions {
  types: OthersFilterOption[];
  projects: OthersFilterOption[];
}

export const EMPTY_OTHERS_SELECTION: OthersSelection = { types: [], projects: [] };

export type OthersSortKey = "newest" | "oldest";

export const OTHERS_SORT_OPTIONS: Array<{ key: OthersSortKey; label: string }> = [
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

/** Build a stable slug for routing when the CMS slug is missing. */
export function otherSlug(item: Pick<CmsOther, "slug" | "title" | "id">): string {
  if (item.slug) return item.slug;
  const fromTitle = (item.title || "").trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return fromTitle || item.id;
}

/** Resolve the display label for a "Project" (groupSlug) filter option. */
export function projectLabel(slug: string): string {
  if (!slug) return "Standalone";
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
