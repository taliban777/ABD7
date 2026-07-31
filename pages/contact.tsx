import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import * as React from "react";
import { ContactPage } from "@/components/contact/ContactPage";
import { fetchCmsProjects } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";

export default function ContactRoute({
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Begin a Project — ARTBYDANI7</title>
        <meta
          name="description"
          content="Commission a project with ARTBYDANI7. Fill out the creative brief."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ContactPage projects={projects} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{ projects: CmsProject[] }> = async () => {
  const projects = await fetchCmsProjects();
  return { props: { projects }, revalidate: 3600 };
};
