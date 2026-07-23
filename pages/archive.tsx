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
    const obj = value as Record<string, unknown>;
    return imageUrl(obj.url || obj.src || obj.imageUrl);
  }
  return "";
}

function extractColumnValue(value: unknown): (string | Record<string, unknown>)[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter((v) => typeof v === "string" || (typeof v === "object" && v !== null));
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    if (obj.name || obj.title || obj.label) return [obj];
    return Object.values(obj).filter((v): v is string => typeof v === "string");
  }
  return [];
}

function collectProjects(value: unknown, seen = new Set<object>()): CmsProject[] {
  const projects: CmsProject[] = [];
  if (!value || typeof value !== "object" || seen.has(value as object)) return projects;
  seen.add(value as object);
  const obj = value as Record<string, unknown>;

  // Direct CMS row: has both a title string and a frontCover
  const title = typeof obj.title === "string" ? obj.title : "";
  const frontCover = imageUrl(obj.frontCover);
  if (title && frontCover) {
    projects.push({
      id: typeof obj.id === "string" ? obj.id : title,
      title,
      slug: typeof obj.slug === "string" ? obj.slug : undefined,
      frontCover,
      artists: extractColumnValue(obj.artists) as CmsProject["artists"],
      categories: extractColumnValue(obj.categories) as CmsProject["categories"],
      style: extractColumnValue(obj.style) as CmsProject["style"],
      palette: extractColumnValue(obj.palette) as CmsProject["palette"],
      year: typeof obj.year === "number" ? obj.year : undefined,
      date: typeof obj.date === "string" ? obj.date : undefined,
    });
  }

  if (Array.isArray(value)) {
    for (const item of value) projects.push(...collectProjects(item, seen));
  } else {
    for (const val of Object.values(obj)) projects.push(...collectProjects(val, seen));
  }

  return projects;
}

export default function ArchiveRoute({ projects }: InferGetStaticPropsType<typeof getStaticProps>) {
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
  // Fetch via the /test Plasmic page which has the CMS data integration
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
