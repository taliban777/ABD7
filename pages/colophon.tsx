import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import * as React from "react";
import { ColophonPage } from "@/components/colophon/ColophonPage";
import { PLASMIC } from "@/plasmic-init";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import type { CmsProject, CmsListValue } from "@/components/archive/types";

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
    if (o.name || o.title || o.label || o.value || o.hex || o.color) return [o as CmsListValue];
  }
  return [];
}

function collectProjects(
  node: unknown,
  seen = new Set<object>()
): CmsProject[] {
  if (!node || typeof node !== "object") return [];
  if (seen.has(node as object)) return [];
  seen.add(node as object);

  const o = node as Record<string, unknown>;
  const results: CmsProject[] = [];

  const title = typeof o.title === "string" ? o.title.trim() : "";
  const frontCover = resolveImageUrl(o.frontCover);

  if (title && frontCover) {
    const id = typeof o.id === "string" ? o.id : title;
    results.push({
      id,
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
    });
  }

  if (Array.isArray(node)) {
    for (const item of node) results.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(o)) results.push(...collectProjects(val, seen));
  }

  const deduped = new Set<string>();
  return results.filter((p) => {
    if (deduped.has(p.id)) return false;
    deduped.add(p.id);
    return true;
  });
}

export default function ColophonRoute({
  projects,
  lastUpdated,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Colophon — ARTBYDANI7</title>
        <meta
          name="description"
          content="Technical notes and archive statistics for ARTBYDANI7."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ColophonPage projects={projects} lastUpdated={lastUpdated} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  projects: CmsProject[];
  lastUpdated: string | null;
}> = async () => {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) {
    return {
      props: { projects: [], lastUpdated: null },
      revalidate: 3600,
    };
  }

  const pageMeta = plasmicData.entryCompMetas[0];
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
  const lastUpdated = new Date().toISOString();

  return { props: { projects, lastUpdated }, revalidate: 3600 };
};
