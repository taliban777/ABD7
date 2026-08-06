import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import * as React from "react";
import { ColophonPage } from "@/components/colophon/ColophonPage";
import { fetchCmsProjects } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";

export default function ColophonRoute({
  projects,
  lastUpdated,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Colophon — ARTBYDANI7</title>
        <meta
          name="description"
          content="Technical notes and archive statistics for ARTBYDANI7."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Colophon — ARTBYDANI7" />
        <meta property="og:description" content="Technical notes and archive statistics for ARTBYDANI7." />
        <link rel="canonical" href="https://artbydani7.com/colophon" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://artbydani7.com/colophon" />
        <meta property="og:image" content="https://artbydani7.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Colophon — ARTBYDANI7" />
        <meta name="twitter:description" content="Technical notes and archive statistics for ARTBYDANI7." />
        <meta name="twitter:image" content="https://artbydani7.com/og-image.png" />
      </Head>
      <ColophonPage projects={projects} lastUpdated={lastUpdated} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  projects: CmsProject[];
  lastUpdated: string | null;
}> = async () => {
  const projects = await fetchCmsProjects();
  const lastUpdated = new Date().toISOString();
  return { props: { projects, lastUpdated }, revalidate: 3600 };
};
