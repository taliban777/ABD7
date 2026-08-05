import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsOthers, fetchCmsProjects } from "@/lib/cms";
import { OthersPage } from "@/components/others/OthersPage";
import type { CmsOther } from "@/components/others/types";
import type { CmsProject } from "@/components/archive/types";

export default function OthersRoute({
  items,
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Others — ARTBYDANI7</title>
        <meta
          name="description"
          content="The wider creative archive of ARTBYDANI7 — posters, branding, logos, experiments and design artefacts."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OthersPage items={items} projects={projects} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  items: CmsOther[];
  projects: CmsProject[];
}> = async () => {
  const [items, projects] = await Promise.all([fetchCmsOthers(), fetchCmsProjects()]);
  return { props: { items, projects }, revalidate: 3600 };
};
