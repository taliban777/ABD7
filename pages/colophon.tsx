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
