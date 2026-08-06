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
        <meta property="og:title" content="Others — ARTBYDANI7" />
        <meta property="og:description" content="The wider creative archive of ARTBYDANI7 — posters, branding, logos, experiments and design artefacts." />
        <link rel="canonical" href="https://artbydani7.com/others" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://artbydani7.com/others" />
        <meta property="og:image" content="https://artbydani7.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Others — ARTBYDANI7" />
        <meta name="twitter:description" content="The wider creative archive of ARTBYDANI7 — posters, branding, logos, experiments and design artefacts." />
        <meta name="twitter:image" content="https://artbydani7.com/og-image.png" />
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
