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
      </Head>
      <CurationsPage exhibitions={exhibitions} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  exhibitions: CurationExhibition[];
}> = async () => {
  const projects: CmsProject[] = await fetchCmsProjects();
  const exhibitions = EXHIBITIONS.map((config) =>
    resolveExhibition(config, projects)
  );
  return { props: { exhibitions }, revalidate: 3600 };
};
