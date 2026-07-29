import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { IndexPage } from "@/components/index-page/IndexPage";
import { PLASMIC } from "@/plasmic-init";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import * as React from "react";
import type { CmsProject, CmsListValue } from "@/components/archive/types";

// Reuse the same CMS project resolver from the project detail page
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

function collectProjects(node: unknown, seen = new Set<object>()): CmsProject[] {
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
      year: typeof o.year === "number" ? o.year : o.year ? Number(o.year) || null : null,
      date: typeof o.date === "string" ? o.date : null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
    });
  }

  if (Array.isArray(node)) {
    for (const item of node) results.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(o)) results.push(...collectProjects(val, seen));
  }

  // Deduplicate by id
  const seen2 = new Set<string>();
  return results.filter((p) => {
    if (seen2.has(p.id)) return false;
    seen2.add(p.id);
    return true;
  });
}

export default function IndexPageRoute({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Index — ARTBYDANI7</title>
        <meta name="description" content="A typographic inventory of the ARTBYDANI7 archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <IndexPage projects={projects} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{ projects: CmsProject[] }> = async () => {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) return { props: { projects: [] }, revalidate: 3600 };

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
  return { props: { projects }, revalidate: 3600 };
};
