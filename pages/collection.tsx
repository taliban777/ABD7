import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArchivePage } from "@/components/archive/ArchivePage";
import { fetchCmsProjects } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";

export default function CollectionRoute({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const router = useRouter();
  const yearParam =
    typeof router.query.year === "string" ? router.query.year : null;

  return (
    <>
      <Head>
        <title>Collection — ARTBYDANI7</title>
        <meta name="description" content="The ARTBYDANI7 project archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ArchivePage projects={projects} initialYear={yearParam} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{
  projects: CmsProject[];
}> = async () => {
  const projects = await fetchCmsProjects();
  return { props: { projects }, revalidate: 3600 };
};
