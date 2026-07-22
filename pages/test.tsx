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

function collectProjects(value: unknown): CmsProject[] {
  const projects: CmsProject[] = [];
  
  if (!value || typeof value !== "object") return projects;
  
  const cache = value as Record<string, unknown>;
  
  console.log(`[v0] Query cache has ${Object.keys(cache).length} keys`);
  for (const k of Object.keys(cache).slice(0, 5)) {
    const v = cache[k];
    console.log(`[v0]   Key: "${k.substring(0, 80)}", type: ${typeof v}, isArray: ${Array.isArray(v)}`);
  }
  
  // Find the CMS data in both arrays
  const cacheArrays = Object.values(cache).filter(Array.isArray);
  console.log(`[v0] Found ${cacheArrays.length} arrays in cache`);
  
  for (let arrayIdx = 0; arrayIdx < cacheArrays.length; arrayIdx++) {
    const arr = cacheArrays[arrayIdx] as unknown[];
    
    // Skip if only 1 item (likely metadata)
    if (arr.length === 1) {
      console.log(`[v0] Array[${arrayIdx}] has 1 item (metadata), skipping`);
      continue;
    }
    
    // Process multi-item arrays
    for (let idx = 1; idx < arr.length; idx++) {
      const item = arr[idx];
      if (!item || typeof item !== "object") continue;
      
      const itemRecord = item as Record<string, unknown>;
      
      // Check if this looks like a row container
      // It should have data field with title, slug, frontCover etc
      if (itemRecord.data && typeof itemRecord.data === "object") {
        const dataField = itemRecord.data as Record<string, unknown>;
        
        // Check if data contains title (project name)
        const titleCol = dataField.title;
        const coverCol = dataField.frontCover;
        
        // If we have title and cover as strings, this is metadata
        if (typeof titleCol === "string" && typeof coverCol === "object") {
          console.log(`[v0] This looks like metadata, not rows`);
          continue;
        }
        
        // Try interpreting data fields as project row data
        const title = typeof titleCol === "string" ? titleCol : "";
        const frontCover = imageUrl(coverCol);
        
        if (title && frontCover) {
          const project: CmsProject = {
            id: typeof itemRecord.id === "string" ? itemRecord.id : `project-${projects.length}`,
            title,
            slug: typeof dataField.slug === "string" ? dataField.slug : undefined,
            frontCover,
            artists: extractColumnValue(dataField.artists),
            categories: extractColumnValue(dataField.categories),
            style: extractColumnValue(dataField.style),
            palette: extractColumnValue(dataField.palette),
            year: typeof dataField.year === "number" ? dataField.year : undefined,
            date: typeof dataField.date === "string" ? dataField.date : undefined,
          };
          console.log(`[v0] ✓ FOUND PROJECT: "${title}"`);
          projects.push(project);
        }
      }
    }
  }
  
  return projects;
}

function extractColumnValue(value: unknown) {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.filter(v => typeof v === "string");
  if (typeof value === "object" && value !== null) {
    return Object.values(value).filter(v => typeof v === "string");
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
  console.log(`[v0] Loaded ${projects.length} projects from Plasmic CMS`);
  return { props: { projects }, revalidate: 60 };
};
