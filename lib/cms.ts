/**
 * lib/cms.ts
 *
 * Single shared data layer for fetching and transforming Plasmic CMS projects.
 * All pages that need project data import from here instead of duplicating
 * these helpers locally.
 */

import * as React from "react";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";
import type { CmsProject, CmsListValue } from "@/components/archive/types";
import { projectSlug } from "@/components/archive/types";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

export function resolveImageUrl(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return resolveImageUrl(value[0]);
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return resolveImageUrl(o.url ?? o.src ?? o.imageUrl ?? o.uri ?? "");
  }
  return "";
}

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

/**
 * Depth-first walk of any query-cache object tree. A node is recognised as a
 * project row when it has BOTH a non-empty `title` string AND a `frontCover`
 * that resolves to a non-empty image URL. Deduplication is performed by `id`.
 */
export function collectProjects(
  node: unknown,
  seen = new Set<object>()
): CmsProject[] {
  const results: CmsProject[] = [];
  if (!node || typeof node !== "object") return results;
  if (seen.has(node as object)) return results;
  seen.add(node as object);

  const o = node as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const frontCover = resolveImageUrl(o.frontCover);

  if (title && frontCover) {
    results.push({
      id: typeof o.id === "string" ? o.id : title,
      title,
      slug: typeof o.slug === "string" ? o.slug : null,
      frontCover,
      artists: resolveListField(o.artists),
      categories: resolveListField(o.categories),
      style: resolveListField(o.style),
      palette: resolveListField(o.palette),
      year:
        typeof o.year === "number"
          ? o.year
          : o.year
          ? Number(o.year) || null
          : null,
      date: typeof o.date === "string" ? o.date : null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
    } as CmsProject);
    // Do NOT recurse into a recognised project row — avoids double-counting
    // nested fields that might themselves match the heuristic.
    return results;
  }

  if (Array.isArray(node)) {
    for (const item of node) results.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(o))
      results.push(...collectProjects(val, seen));
  }

  // Deduplicate by id
  const deduped = new Set<string>();
  return results.filter((p) => {
    if (deduped.has(p.id)) return false;
    deduped.add(p.id);
    return true;
  });
}

/**
 * Depth-first walk to find a single project matching `targetSlug`.
 * Returns `null` when not found.
 */
export function findProjectBySlug(
  node: unknown,
  targetSlug: string,
  seen = new Set<object>()
): CmsProject | null {
  if (!node || typeof node !== "object") return null;
  if (seen.has(node as object)) return null;
  seen.add(node as object);

  const o = node as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const frontCover = resolveImageUrl(o.frontCover);

  if (title && frontCover) {
    const project: CmsProject = {
      id: typeof o.id === "string" ? o.id : title,
      title,
      slug: typeof o.slug === "string" ? o.slug : null,
      frontCover,
      artists: resolveListField(o.artists),
      categories: resolveListField(o.categories),
      style: resolveListField(o.style),
      palette: resolveListField(o.palette),
      year:
        typeof o.year === "number"
          ? o.year
          : o.year
          ? Number(o.year) || null
          : null,
      date: typeof o.date === "string" ? o.date : null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
    };

    if (projectSlug(project) === targetSlug) return project;
  }

  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findProjectBySlug(item, targetSlug, seen);
      if (result) return result;
    }
  } else {
    for (const val of Object.values(o)) {
      const result = findProjectBySlug(val, targetSlug, seen);
      if (result) return result;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Public fetch helpers
// ---------------------------------------------------------------------------

/**
 * Fetch and extract all CMS projects from the Plasmic `/test` page.
 * This is the single source-of-truth fetch used by every route that
 * needs the project list.
 */
export async function fetchCmsProjects(): Promise<CmsProject[]> {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) return [];

  const pageMeta = plasmicData.entryCompMetas[0];

  const queryCache = await extractPlasmicQueryData(
    React.createElement(
      PlasmicRootProvider,
      {
        loader: PLASMIC,
        prefetchedData: plasmicData,
        pageRoute: pageMeta.path,
        pageParams: pageMeta.params,
      },
      React.createElement(PlasmicComponent, { component: pageMeta.displayName })
    )
  );

  return collectProjects(queryCache);
}

/**
 * Fetch all projects and return the one matching `slug`.
 * Returns `null` when the slug does not match any project.
 */
export async function fetchCmsProjectBySlug(
  slug: string
): Promise<CmsProject | null> {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) return null;

  const pageMeta = plasmicData.entryCompMetas[0];

  const queryCache = await extractPlasmicQueryData(
    React.createElement(
      PlasmicRootProvider,
      {
        loader: PLASMIC,
        prefetchedData: plasmicData,
        pageRoute: pageMeta.path,
        pageParams: pageMeta.params,
      },
      React.createElement(PlasmicComponent, { component: pageMeta.displayName })
    )
  );

  return findProjectBySlug(queryCache, slug);
}
