import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsProjects, fetchCmsProjectBySlug } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";
import { valueLabel, asArray, projectSlug } from "@/components/archive/types";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { ProjectDetailPage } from "@/components/project-detail/ProjectDetailPage";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProjectPage({
  project,
  allProjects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!project) {
    return (
      <>
        <Head>
          <title>Not Found — ARTBYDANI7</title>
        </Head>
        <GlobalNav projects={allProjects} />
        <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
          <p>Project not found.</p>
        </div>
      </>
    );
  }

  const artistNames = asArray(project.artists)
    .map(valueLabel)
    .filter(Boolean)
    .join(", ");

  const categoryNames = asArray(project.categories).map(valueLabel).filter(Boolean);
  const description = [
    project.title,
    categoryNames.length ? categoryNames.join(", ") : null,
    project.year ? String(project.year) : null,
    artistNames ? `by ${artistNames}` : null,
    "— ARTBYDANI7 archive.",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <Head>
        <title>{project.title} — ARTBYDANI7</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:title" content={`${project.title} — ARTBYDANI7`} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://artbydani7.com/projects/${projectSlug(project)}`} />
        {project.frontCover && <meta property="og:image" content={project.frontCover} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${project.title} — ARTBYDANI7`} />
        <meta name="twitter:description" content={description} />
        {project.frontCover && <meta name="twitter:image" content={project.frontCover} />}
      </Head>
      <GlobalNav projects={allProjects} />
      <ProjectDetailPage project={project} allProjects={allProjects} />
    </>
  );
}

// ---------------------------------------------------------------------------
// Data fetching — ISR
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const projects = await fetchCmsProjects();
  const paths = projects
    .filter((p) => projectSlug(p))
    .map((p) => ({ params: { slug: projectSlug(p) } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<{
  project: CmsProject | null;
  allProjects: CmsProject[];
}> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const [project, allProjects] = await Promise.all([
    fetchCmsProjectBySlug(slug),
    fetchCmsProjects(),
  ]);

  if (!project) return { notFound: true };

  return { props: { project, allProjects }, revalidate: 3600 };
};
