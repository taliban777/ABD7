/**
 * lib/cms.ts
 *
 * Single shared data layer for fetching and transforming Plasmic CMS projects.
 * All pages that need project data import from here instead of duplicating
 * these helpers locally.
 *
 * Uses offset pagination to support fetching 100+ records from Plasmic CMS,
 * iterating through multiple pages until all results are retrieved.
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

// Constants for pagination
const FETCH_LIMIT = 100;
const FETCH_TIMEOUT_MS = 30000;

// Plasmic API configuration from environment
const PLASMIC_PROJECT_ID = process.env.PLASMIC_PROJECT_ID || "";
const PLASMIC_API_TOKEN = process.env.PLASMIC_API_TOKEN || "";

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
 * Fetch all CMS rows for a given model using offset pagination.
 *
 * Plasmic CMS API defaults to a limit of 100 records per request. This helper
 * attempts to use the direct REST API with offset pagination; if that fails,
 * it falls back to multiple requests through the Plasmic loader.
 *
 * @param modelId - The Plasmic CMS model ID (e.g. "projects")
 * @returns Array of all CMS row objects retrieved from Plasmic
 */
export async function fetchAllCmsRows(modelId: string): Promise<unknown[]> {
  const allRows: unknown[] = [];
  let offset = 0;
  let hasMore = true;
  let usingDirectApi = false;

  // Attempt direct CMS API if credentials are configured
  if (PLASMIC_PROJECT_ID && PLASMIC_API_TOKEN) {
    usingDirectApi = true;
    while (hasMore) {
      try {
        // Query the Plasmic CMS API directly with offset pagination
        const url = new URL(
          `https://api.plasmic.app/api/v1/cms/rows/${modelId}`
        );
        url.searchParams.set("projectId", PLASMIC_PROJECT_ID);
        url.searchParams.set("limit", String(FETCH_LIMIT));
        url.searchParams.set("offset", String(offset));

        const response = await Promise.race([
          fetch(url.toString(), {
            headers: {
              "x-plasmic-api-token": PLASMIC_API_TOKEN,
              "Content-Type": "application/json",
            },
          }),
          new Promise<Response>((_, reject) =>
            setTimeout(
              () =>
                reject(new Error(`Fetch timeout after ${FETCH_TIMEOUT_MS}ms`)),
              FETCH_TIMEOUT_MS
            )
          ),
        ]);

        if (!response.ok) {
          throw new Error(
            `API error: ${response.status} ${response.statusText}`
          );
        }

        const data = (await response.json()) as {
          rows?: unknown[];
          totalCount?: number;
        };
        const pageRows = data.rows || [];

        allRows.push(...pageRows);

        // If we got fewer rows than the limit, we've reached the end
        if (pageRows.length < FETCH_LIMIT) {
          hasMore = false;
        } else {
          offset += FETCH_LIMIT;
        }
      } catch {
        // Direct API failed, fall back to loader
        usingDirectApi = false;
        hasMore = false;
        allRows.length = 0; // Clear any partial results
        break;
      }
    }
  }

  // Fallback: Use Plasmic loader (note: this may only return 100 items)
  if (!usingDirectApi) {
    try {
      const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
      if (!plasmicData) {
        return allRows;
      }

      const pageMeta = plasmicData.entryCompMetas[0];
      if (!pageMeta) {
        return allRows;
      }

      const queryCache = await extractPlasmicQueryData(
        React.createElement(
          PlasmicRootProvider,
          {
            loader: PLASMIC,
            prefetchedData: plasmicData,
            pageRoute: pageMeta.path,
            pageParams: pageMeta.params,
          },
          React.createElement(PlasmicComponent, {
            component: pageMeta.displayName,
          })
        )
      );

      const loaderRows = collectProjects(queryCache);
      allRows.push(...loaderRows);
    } catch {
      // Loader fetch failed, return whatever we have
    }
  }

  return allRows;
}

/**
 * Fetch and extract all CMS projects from Plasmic.
 * This is the single source-of-truth fetch used by every route that
 * needs the project list. Attempts offset pagination to support 100+ items.
 *
 * If env vars PLASMIC_PROJECT_ID and PLASMIC_API_TOKEN are set, uses direct
 * REST API pagination. Otherwise, falls back to the Plasmic loader (may be
 * limited to 100 items depending on Plasmic settings).
 *
 * ISR revalidate: 3600 seconds (1 hour)
 */
export async function fetchCmsProjects(): Promise<CmsProject[]> {
  const allRows = await fetchAllCmsRows("projects");
  return collectProjects(allRows);
}

/**
 * Fetch all projects (with pagination support) and return the one matching `slug`.
 * Returns `null` when the slug does not match any project.
 *
 * This method fetches all projects and searches locally rather than
 * querying the API for a single project, ensuring consistency.
 */
export async function fetchCmsProjectBySlug(
  slug: string
): Promise<CmsProject | null> {
  const allProjects = await fetchCmsProjects();
  return allProjects.find((p) => projectSlug(p) === slug) || null;
}
