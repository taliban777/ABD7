import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { PlasmicComponent, PlasmicRootProvider, extractPlasmicQueryData } from "@plasmicapp/loader-nextjs";
import { ArchivePage } from "@/components/archive/ArchivePage";
import type { CmsListValue, CmsProject } from "@/components/archive/types";
import { PLASMIC } from "@/plasmic-init";

function asList(value: unknown): CmsListValue[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter((item): item is CmsListValue => typeof item === "string" || Boolean(item && typeof item === "object"));
  return typeof value === "string" || typeof value === "object" ? [value as CmsListValue] : [];
}

function imageUrl(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return imageUrl(value[0]);
  if (value && typeof value === "object") {
    const image = value as Record<string, unknown>;
    return imageUrl(image.url || image.src || image.imageUrl);
  }
  return "";
}

function collectProjects(value: unknown, found = new Map<string, CmsProject>(), seen = new Set<object>()): CmsProject[] {
  if (!value || typeof value !== "object" || seen.has(value)) return Array.from(found.values());
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectProjects(item, found, seen));
    return Array.from(found.values());
  }

  const record = value as Record<string, unknown>;
  const data = record.data && typeof record.data === "object" ? record.data as Record<string, unknown> : record;
  const title = typeof data.title === "string" ? data.title : "";
  const cover = imageUrl(data.frontCover);
  if (title && cover) {
    const sourceId = String(record.id || data.id || `${title}-${data.year || ""}`);
    const archiveKey = `${title.trim().toLocaleLowerCase()}|${cover}`;
    found.set(archiveKey, {
      id: sourceId,
      title,
      slug: typeof data.slug === "string" && data.slug ? data.slug : undefined,
      frontCover: cover,
      artists: asList(data.artists),
      categories: asList(data.categories),
      style: asList(data.style),
      palette: asList(data.palette),
      year: typeof data.year === "number" ? data.year : Number(data.year) || undefined,
      date: typeof data.date === "string" ? data.date : undefined,
      createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
    });
  }
  Object.values(record).forEach((item) => collectProjects(item, found, seen));
  return Array.from(found.values());
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
  const plasmicData = await PLASMIC.maybeFetchComponentData("Archive");
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
