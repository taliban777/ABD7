/**
 * ============================================================================
 * Server-side CMS access — the single entry point for reading projects.
 * ============================================================================
 *
 * Every page and API route calls `getCmsProjects()`. Nothing else talks to
 * Plasmic directly, so adding a future CMS-driven page requires no new
 * fetching code.
 *
 * SERVER ONLY. Do not import this from a component — it pulls in the Plasmic
 * loader and React server rendering. Client code should use the /api/projects
 * route (see components/nav/useCmsProjects.ts).
 */

import * as React from "react";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";
import type { CmsProject } from "@/components/archive/types";
import { collectProjects } from "./resolve";

/**
 * The Plasmic page that hosts the CMS query feeding the archive. Centralised
 * here so it is changed in one place rather than in five getStaticProps.
 */
const CMS_SOURCE_PAGE = "/test";

/** How long a resolved project list is reused within a single server process. */
const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  projects: CmsProject[];
  fetchedAt: number;
}

let cache: CacheEntry | null = null;
let inflight: Promise<CmsProject[]> | null = null;

async function fetchFromPlasmic(): Promise<CmsProject[]> {
  const plasmicData = await PLASMIC.maybeFetchComponentData(CMS_SOURCE_PAGE);
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) return [];

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
 * Resolve every project in the CMS.
 *
 * Results are memoised for CACHE_TTL_MS and concurrent callers share one
 * in-flight request, so a build that renders Home, Collection, Catalogue,
 * Colophon and Contact performs a single CMS round trip instead of five.
 */
export async function getCmsProjects(): Promise<CmsProject[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.projects;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const projects = await fetchFromPlasmic();
      cache = { projects, fetchedAt: Date.now() };
      return projects;
    } catch (error) {
      console.log("[v0] getCmsProjects failed:", (error as Error).message);
      // Serve the last good list rather than blanking the site on a hiccup.
      return cache?.projects ?? [];
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/**
 * Standard props shared by every CMS-driven page. Pages spread this into
 * getStaticProps so navigation and statistics are always server-rendered.
 */
export interface CmsPageProps {
  projects: CmsProject[];
  lastUpdated: string | null;
}

/** Build the shared props object for a CMS-driven page. */
export async function getCmsPageProps(): Promise<CmsPageProps> {
  const projects = await getCmsProjects();
  return { projects, lastUpdated: new Date().toISOString() };
}
