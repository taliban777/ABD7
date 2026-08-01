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

// Plasmic CMS Data API configuration from environment.
// These are the CMS *database* ID and CMS *public* token — NOT the loader
// project ID/token in plasmic-init.ts. Find them in Plasmic Studio under
// the CMS's "Settings" → "API tokens".
const PLASMIC_CMS_ID = process.env.PLASMIC_CMS_ID || "";
const PLASMIC_CMS_PUBLIC_TOKEN = process.env.PLASMIC_CMS_PUBLIC_TOKEN || "";

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
 * Fetch all CMS rows for a given model using offset pagination against the
 * Plasmic CMS Data API.
 *
 * The Plasmic CMS Data API caps each request at 100 rows (`q.limit`), so this
 * helper loops with an increasing `q.offset` until a short page is returned,
 * guaranteeing that ALL rows are retrieved (not just the first 100).
 *
 * Endpoint:
 *   GET https://data.plasmic.app/api/v1/cms/databases/{CMS_ID}/tables/{model}/query
 *   Header: x-plasmic-api-cms-tokens: {CMS_ID}:{PUBLIC_TOKEN}
 *
 * Requires env vars PLASMIC_CMS_ID and PLASMIC_CMS_PUBLIC_TOKEN. When they are
 * absent, falls back to a single Plasmic loader fetch (which may be limited to
 * 100 items by the page's data query).
 *
 * @param modelId - The Plasmic CMS table/model identifier (e.g. "projects")
 * @returns Array of all CMS row objects retrieved from Plasmic
 */
export async function fetchAllCmsRows(modelId: string): Promise<unknown[]> {
  const allRows: unknown[] = [];

  // Preferred path: direct CMS Data API with offset pagination.
  if (PLASMIC_CMS_ID && PLASMIC_CMS_PUBLIC_TOKEN) {
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      try {
        const url = new URL(
          `https://data.plasmic.app/api/v1/cms/databases/${PLASMIC_CMS_ID}/tables/${modelId}/query`
        );
        url.searchParams.set("q.limit", String(FETCH_LIMIT));
        url.searchParams.set("q.offset", String(offset));

        const response = await Promise.race([
          fetch(url.toString(), {
            headers: {
              "x-plasmic-api-cms-tokens": `${PLASMIC_CMS_ID}:${PLASMIC_CMS_PUBLIC_TOKEN}`,
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
            `Plasmic CMS API error: ${response.status} ${response.statusText}`
          );
        }

        // The CMS Data API returns each row wrapped as { id, identifier, data: {...} }.
        // Unwrap `data` so downstream extraction sees the actual field values.
        const json = (await response.json()) as {
          rows?: Array<Record<string, unknown>>;
        };
        const rawRows = json.rows || [];
        const pageRows = rawRows.map((r) =>
          r && typeof r === "object" && "data" in r
            ? { id: r.id, ...(r.data as Record<string, unknown>) }
            : r
        );

        allRows.push(...pageRows);

        // Short page => we've reached the end.
        if (rawRows.length < FETCH_LIMIT) {
          hasMore = false;
        } else {
          offset += FETCH_LIMIT;
        }
      } catch (err) {
        console.log("[v0] Plasmic CMS Data API fetch failed:", err);
        hasMore = false;
      }
    }

    if (allRows.length > 0) return allRows;
  }

  // Fallback: single Plasmic loader fetch (may be capped at 100 by the query).
  try {
    const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
    if (!plasmicData) return allRows;

    const pageMeta = plasmicData.entryCompMetas[0];
    if (!pageMeta) return allRows;

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
    // Loader fetch failed, return whatever we have.
  }

  return allRows;
}

/**
 * Fetch and extract all CMS projects from Plasmic.
 * This is the single source-of-truth fetch used by every route that
 * needs the project list. Attempts offset pagination to support 100+ items.
 *
 * If env vars PLASMIC_CMS_ID and PLASMIC_CMS_PUBLIC_TOKEN are set, uses direct
 * CMS Data API pagination (fetches ALL rows). Otherwise, falls back to the
 * Plasmic loader (may be limited to 100 items depending on Plasmic settings).
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
