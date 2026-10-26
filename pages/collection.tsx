import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { ArchivePage } from "@/components/archive/ArchivePage";
import { fetchCmsProjects } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";

export default function CollectionRoute({
  projects,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const router = useRouter();
  const yearParam =
    typeof router.query.year === "string" ? router.query.year : null;

  return (
    <>
      <Head>
        <title>Collection — ARTBYDANI7</title>
        <meta name="description" content="A curated digital archive of artwork by ARTBYDANI7. Browse the complete collection." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content="Collection — ARTBYDANI7" />
        <meta property="og:description" content="A curated digital archive of artwork by ARTBYDANI7. Browse the complete collection." />
        <link rel="canonical" href="https://artbydani7.com/collection" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://artbydani7.com/collection" />
        <meta property="og:image" content="https://artbydani7.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Collection — ARTBYDANI7" />
        <meta name="twitter:description" content="A curated digital archive of artwork by ARTBYDANI7. Browse the complete collection." />
        <meta name="twitter:image" content="https://artbydani7.com/og-image.png" />
      </Head>
      <ArchivePage projects={projects} initialYear={yearParam} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{
  projects: CmsProject[];
}> = async ({ res }) => {
  const projects = await fetchCmsProjects();

  // CMS changes should be visible on the next request instead of waiting for
  // the previous page's ISR window to expire.
  res.setHeader("Cache-Control", "private, no-store, max-age=0");

  return { props: { projects } };
};
