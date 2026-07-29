import * as React from "react";
import {
  PlasmicComponent,
  extractPlasmicQueryData,
  ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps } from "next";

import Error from "next/error";
import { useRouter } from "next/router";
import Head from "next/head";
import HomePage from "@/components/home/HomePage";
import { IndexPage } from "@/components/index-page/IndexPage";
import { PLASMIC } from "@/plasmic-init";
import type { CmsProject, CmsListValue } from "@/components/archive/types";

// Helper to resolve image URLs from CMS
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

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, unknown>;
  isHomepage?: boolean;
  isIndexPage?: boolean;
  projects?: CmsProject[];
}) {
  const { plasmicData, queryCache, isHomepage, isIndexPage, projects = [] } = props;
  const router = useRouter();

  if (isHomepage) {
    return (
      <>
        <Head>
          <title>ARTBYDANI7</title>
          <meta name="description" content="Independent art direction and visual archive." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <HomePage />
      </>
    );
  }

  if (isIndexPage) {
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
  
  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
  }
  const pageMeta = plasmicData.entryCompMetas[0];
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
      pageQuery={router.query}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const isHomepage = !catchall || (Array.isArray(catchall) && catchall.length === 0);

  if (isHomepage) {
    return { props: { isHomepage: true }, revalidate: 3600 };
  }

  const plasmicPath = typeof catchall === "string" ? catchall : Array.isArray(catchall) ? `/${catchall.join("/")}` : "/";

  // Special handling for /index: render as IndexPage instead of Plasmic component
  if (plasmicPath === "/index") {
    // Fetch the "/test" (archive) page data to get projects
    const testData = await PLASMIC.maybeFetchComponentData("/test");
    if (!testData) {
      return { props: { isIndexPage: true, projects: [] }, revalidate: 3600 };
    }

    const testMeta = testData.entryCompMetas[0];
    const queryCache = await extractPlasmicQueryData(
      <PlasmicRootProvider
        loader={PLASMIC}
        prefetchedData={testData}
        pageRoute={testMeta.path}
        pageParams={testMeta.params}
      >
        <PlasmicComponent component={testMeta.displayName} />
      </PlasmicRootProvider>
    );

    const projects = collectProjects(queryCache);
    return { props: { isIndexPage: true, projects }, revalidate: 3600 };
  }

  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

  if (!plasmicData) {
    // non-Plasmic catch-all
    return { props: {} };
  }
  
  const pageMeta = plasmicData.entryCompMetas[0];
  // Cache the necessary data fetched for the page
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
  // Use revalidate if you want incremental static regeneration
  return { props: { plasmicData, queryCache }, revalidate: 60 };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const pageModules = await PLASMIC.fetchPages();
  const EXCLUDED = new Set(["/archive", "/test", "/contact", "/colophon"]);
  
  const paths = pageModules
    .filter((mod) => !EXCLUDED.has(mod.path))
    .map((mod) => ({
      params: {
        catchall: mod.path.substring(1).split("/"),
      },
    }));

  return {
    paths,
    fallback: "blocking",
  };
}
