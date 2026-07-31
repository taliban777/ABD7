import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import { fetchCmsProjects, fetchCmsProjectBySlug } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";
import { valueLabel, asArray, projectSlug } from "@/components/archive/types";
import { getProjectImageUrl } from "@/components/images/cloudinary";
import styles from "@/components/archive/archive.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function ProjectDetailPage({
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
        <div className={styles.archivePage}>
          <p className={styles.empty}>Project not found.</p>
        </div>
      </>
    );
  }

  const artistNames = asArray(project.artists)
    .map(valueLabel)
    .filter(Boolean)
    .join(", ");
  const categories = asArray(project.categories).map(valueLabel).filter(Boolean);
  const styles_list = asArray(project.style).map(valueLabel).filter(Boolean);

  return (
    <>
      <Head>
        <title>{project.title} — ARTBYDANI7</title>
        <meta
          name="description"
          content={`${project.title} by ${artistNames || "ARTBYDANI7"}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalNav projects={allProjects} />
      <div className={styles.archivePage}>
        <main style={{ maxWidth: "900px", margin: "0 auto", paddingTop: "40px" }}>
          <div style={{ marginBottom: "48px" }}>
            <Link
              href="/collection"
              style={{
                color: "var(--muted)",
                textDecoration: "none",
                fontSize: "12px",
              }}
            >
              ← Back to Archive
            </Link>
          </div>

          {/* Image */}
          <div
            style={{
              aspectRatio: "1 / 1",
              background: "var(--surface)",
              marginBottom: "40px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {project.frontCover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={getProjectImageUrl(project.frontCover)}
                alt={project.title}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : null}
          </div>

          {/* Metadata */}
          <div
            style={{
              background: "var(--label)",
              border: "1px solid var(--line)",
              padding: "20px",
            }}
          >
            <h1
              style={{
                font: "700 20px/1.3 var(--font-mono)",
                textTransform: "uppercase",
                marginBottom: "12px",
              }}
            >
              {project.title}
            </h1>
            {artistNames && (
              <p
                style={{
                  font: "400 14px/1.4 var(--font-mono)",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "16px",
                }}
              >
                {artistNames}
              </p>
            )}
            {project.year && (
              <p
                style={{
                  font: "500 12px/1.4 var(--font-mono)",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                <strong>Year:</strong> {project.year}
              </p>
            )}
            {categories.length > 0 && (
              <p
                style={{
                  font: "500 12px/1.4 var(--font-mono)",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                <strong>Categories:</strong> {categories.join(", ")}
              </p>
            )}
            {styles_list.length > 0 && (
              <p
                style={{
                  font: "500 12px/1.4 var(--font-mono)",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  marginBottom: "8px",
                }}
              >
                <strong>Styles:</strong> {styles_list.join(", ")}
              </p>
            )}
          </div>
        </main>
      </div>
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
