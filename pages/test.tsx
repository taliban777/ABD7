import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";
import { ArchivePage } from "@/components/archive/ArchivePage";
import type { CmsProject } from "@/components/archive/types";
import type { CmsListValue } from "@/components/archive/types";

// ---------------------------------------------------------------------------
// Helpers — run server-side only
// ---------------------------------------------------------------------------

function resolveImageUrl(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return resolveImageUrl(value[0]);
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return resolveImageUrl(o.url ?? o.src ?? o.imageUrl ?? o.uri ?? "");
  }
  return "";
}

function resolveListField(value: unknown): CmsListValue[] {
  if (!value) return [];
  if (typeof value === "string") return value.length ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter(
      (v) => typeof v === "string" || (typeof v === "object" && v !== null)
    ) as CmsListValue[];
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    // Single object that is itself a list-value shape
    if (o.name || o.title || o.label || o.value || o.hex || o.color) {
      return [o as CmsListValue];
    }
  }
  return [];
}

/**
 * Depth-first walk of the queryCache object tree. A node is recognised as a
 * project row when it has BOTH a non-empty `title` string AND a `frontCover`
 * that resolves to a non-empty image URL. This makes the extraction resilient
 * to any change in the CMS query key structure without touching code.
 */
function collectProjects(
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

  // Recurse into every value
  if (Array.isArray(node)) {
    for (const item of node) results.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(o))
      results.push(...collectProjects(val, seen));
  }

  return results;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function TestArchiveRoute({
  projects,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Archive — ARTBYDANI7</title>
        <meta name="description" content="The ARTBYDANI7 project archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ArchivePage projects={projects} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Data fetching — real Plasmic CMS, no hardcoded projects
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<{
  projects: CmsProject[];
}> = async () => {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) {
    return { props: { projects: [] } };
  }

  const pageMeta = plasmicData.entryCompMetas[0];

  // extractPlasmicQueryData expects a React element — this is valid in a .tsx
  // file; Next.js compiles it with the JSX transform before execution.
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );

  const projects = collectProjects(queryCache);

  return { props: { projects } };
};
