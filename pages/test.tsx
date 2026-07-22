import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { PlasmicComponent, PlasmicRootProvider, extractPlasmicQueryData } from "@plasmicapp/loader-nextjs";
import { ArchivePage } from "@/components/archive/ArchivePage";
import type { CmsProject } from "@/components/archive/types";
import { PLASMIC } from "@/plasmic-init";

function imageUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageUrl(value[0]);
  if (value && typeof value === "object") {
    const image = value as Record<string, unknown>;
    return imageUrl(image.url || image.src || image.imageUrl);
  }
  return "";
}

function collectProjects(value: unknown, seen = new Set<object>()): CmsProject[] {
  const projects: CmsProject[] = [];
  
  if (!value || typeof value !== "object" || seen.has(value as object)) return projects;
  seen.add(value as object);
  
  // Check if THIS object looks like a project row (has both title string and frontCover)
  const obj = value as Record<string, unknown>;
  const title = typeof obj.title === "string" ? obj.title : "";
  const frontCover = imageUrl(obj.frontCover);
  
  if (title && frontCover && title.length > 0) {
    projects.push({
      id: typeof obj.id === "string" ? obj.id : title,
      title,
      slug: typeof obj.slug === "string" ? obj.slug : undefined,
      frontCover,
      artists: extractColumnValue(obj.artists),
      categories: extractColumnValue(obj.categories),
      style: extractColumnValue(obj.style),
      palette: extractColumnValue(obj.palette),
      year: typeof obj.year === "number" ? obj.year : undefined,
      date: typeof obj.date === "string" ? obj.date : undefined,
    });
  }
  
  // Recurse into array items and object values
  if (Array.isArray(value)) {
    for (const item of value) {
      projects.push(...collectProjects(item, seen));
    }
  } else {
    for (const val of Object.values(obj)) {
      projects.push(...collectProjects(val, seen));
    }
  }
  
  return projects;
}

function extractColumnValue(value: unknown): (string | { name?: string; title?: string; label?: string; value?: string; color?: string; hex?: string })[] {
  // Handle string
  if (typeof value === "string") return [value];
  
  // Handle array of strings or objects
  if (Array.isArray(value)) {
    return value.filter((v): v is string | Record<string, unknown> => typeof v === "string" || (typeof v === "object" && v !== null));
  }
  
  // Handle single object
  if (typeof value === "object" && value !== null) {
    // If it has typical artist fields, return it as-is
    const obj = value as Record<string, unknown>;
    if (obj.name || obj.title || obj.label) {
      return [obj as any];
    }
    // Otherwise try to extract string values
    return Object.values(obj).filter((v): v is string => typeof v === "string");
  }
  
  return [];
}

export default function TestArchiveRoute({ projects }: InferGetStaticPropsType<typeof getStaticProps>) {
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

export const getStaticProps: GetStaticProps<{ projects: CmsProject[] }> = async () => {
  const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
  if (!plasmicData) return { props: { projects: [] }, revalidate: 60 };
  
  const pageMeta = plasmicData.entryCompMetas[0];
  const queryCache = await extractPlasmicQueryData(
    <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData} pageRoute={pageMeta.path} pageParams={pageMeta.params}>
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
  
  const projects = JSON.parse(JSON.stringify(collectProjects(queryCache))) as CmsProject[];
  return { props: { projects }, revalidate: 60 };
};
