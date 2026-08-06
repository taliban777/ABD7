import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsProjects } from "@/lib/cms";
import { EXHIBITIONS } from "@/components/curations/data";
import { resolveExhibition } from "@/components/curations/types";
import type { CurationExhibition } from "@/components/curations/types";
import { CurationsPage } from "@/components/curations/CurationsPage";
import type { CmsProject } from "@/components/archive/types";

export default function CurationsRoute({
  exhibitions,
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Curations — ARTBYDANI7</title>
        <meta
          name="description"
          content="Five curated readings of the archive. Each exhibition proposes a different way of seeing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Curations — ARTBYDANI7" />
        <meta property="og:description" content="Five curated readings of the archive. Each exhibition proposes a different way of seeing." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://artbydani7.com/curations" />
        <meta property="og:image" content="https://artbydani7.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Curations — ARTBYDANI7" />
        <meta name="twitter:description" content="Five curated readings of the archive. Each exhibition proposes a different way of seeing." />
        <meta name="twitter:image" content="https://artbydani7.com/og-image.png" />
      </Head>
      <CurationsPage exhibitions={exhibitions} projects={projects} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  exhibitions: CurationExhibition[];
  projects: CmsProject[];
}> = async () => {
  const projects: CmsProject[] = await fetchCmsProjects();
  const exhibitions = EXHIBITIONS.map((config) =>
    resolveExhibition(config, projects)
  );
  return { props: { exhibitions, projects }, revalidate: 3600 };
};
