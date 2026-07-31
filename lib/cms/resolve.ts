/**
 * ============================================================================
 * CMS field resolution — the single canonical implementation.
 * ============================================================================
 *
 * This logic previously existed as four separate copies (collection.tsx,
 * colophon.tsx, contact.tsx, [[...catchall]].tsx, projects/[slug].tsx) which
 * had already drifted apart: one returned early and never deduplicated,
 * another deduplicated on every recursion level. Any new CMS field had to be
 * added in five places.
 *
 * Everything now derives from here. No page re-implements extraction.
 */

import type { CmsListValue, CmsProject } from "@/components/archive/types";

/** Unwrap a Plasmic image field, which may be a string, array, or object. */
export function resolveImageUrl(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return resolveImageUrl(value[0]);
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return resolveImageUrl(o.url ?? o.src ?? o.imageUrl ?? o.uri ?? "");
  }
  return "";
}

/** Coerce a Plasmic list field into a consistent array of list values. */
export function resolveListField(value: unknown): CmsListValue[] {
  if (!value) return [];
  if (typeof value === "string") return value.length ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter(
      (v) => typeof v === "string" || (typeof v === "object" && v !== null)
    ) as CmsListValue[];
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (o.name || o.title || o.label || o.value || o.hex || o.color) {
      return [o as CmsListValue];
    }
  }
  return [];
}

/** Coerce a possibly-string CMS number into a number or null. */
function resolveNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isNaN(value) ? null : value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

/** Read the first present string key from a CMS row. */
function resolveString(o: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

/**
 * Map a raw CMS row into a CmsProject.
 *
 * Field aliases are accepted so that renaming a column in Plasmic (or adding
 * `releaseDate` alongside `date`) does not require a code change here.
 */
function toProject(o: Record<string, unknown>, title: string, frontCover: string): CmsProject {
  const year = resolveNumber(o.year);
  const date = resolveString(o, "date", "releaseDate", "released", "publishedAt");

  return {
    id: typeof o.id === "string" ? o.id : title,
    title,
    slug: resolveString(o, "slug"),
    frontCover,
    artists: resolveListField(o.artists),
    categories: resolveListField(o.categories),
    style: resolveListField(o.style),
    palette: resolveListField(o.palette),
    // Derive the year from the release date when the year column is empty, so
    // the nav dropdown and every year statistic still populate.
    year: year ?? (date ? resolveNumber(new Date(date).getFullYear()) : null),
    date,
    createdAt: resolveString(o, "createdAt", "created_at"),
  };
}

/**
 * Depth-first walk of the Plasmic queryCache tree.
 *
 * A node counts as a project row when it has BOTH a non-empty `title` and a
 * `frontCover` that resolves to an image URL. This keeps extraction resilient
 * to changes in Plasmic's internal query-key structure.
 *
 * Recursion does NOT stop at a matched row, because Plasmic sometimes nests
 * the real collection beneath a wrapper that also carries a title/cover.
 * Deduplication by id happens once, at the end.
 */
export function collectProjects(node: unknown): CmsProject[] {
  const found: CmsProject[] = [];
  const seen = new Set<object>();

  const walk = (current: unknown): void => {
    if (!current || typeof current !== "object") return;
    if (seen.has(current as object)) return;
    seen.add(current as object);

    const o = current as Record<string, unknown>;
    const title = typeof o.title === "string" ? o.title.trim() : "";
    const frontCover = resolveImageUrl(o.frontCover);

    if (title && frontCover) found.push(toProject(o, title, frontCover));

    if (Array.isArray(current)) {
      for (const item of current) walk(item);
    } else {
      for (const val of Object.values(o)) walk(val);
    }
  };

  walk(node);

  // Deduplicate once, keeping the first (outermost) occurrence of each id.
  const byId = new Set<string>();
  return found.filter((p) => {
    if (byId.has(p.id)) return false;
    byId.add(p.id);
    return true;
  });
}

/** Find a single project by its resolved slug. */
export function findProjectBySlug(
  projects: CmsProject[],
  targetSlug: string
): CmsProject | null {
  for (const project of projects) {
    const slug =
      project.slug ??
      (project.title || "")
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") ??
      project.id;
    if (slug === targetSlug) return project;
  }
  return null;
}
