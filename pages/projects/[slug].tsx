import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  PlasmicComponent,
  PlasmicRootProvider,
  extractPlasmicQueryData,
} from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";
import type { CmsProject, CmsListValue } from "@/components/archive/types";
import { valueLabel, asArray, projectSlug } from "@/components/archive/types";
import { getProjectImageUrl } from "@/components/images/cloudinary";
import styles from "@/components/archive/archive.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";

// ---------------------------------------------------------------------------
// Helpers — run server-side only
// ---------------------------------------------------------------------------

function resolveImageUrl(value: unknown): string {
  if (typeof value === "string" && value.length > 0) return value;
  if (Array.isArray(value) && value.length > 0) return resolveImageUrl(value[0]);
  if (value !== null && typeof value === "object") {
    const o = value as Record<string, unknown>;
    return resolveImageUrl(o.url ?? o.src ?? o.imageUrl ?? o.uri ?? "");
  }
  return "";
}

function resolveListField(value: unknown): CmsListValue[] {
  if (!value) return [];
  if (typeof value === "string") return value.length ? [value] : [];
  if (Array.isArray(value)) {
    return value.filter(
      (v) => typeof v === "string" || (typeof v === "object" && v !== null)
    ) as CmsListValue[];
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (o.name || o.title || o.label || o.value || o.hex || o.color) {
      return [o as CmsListValue];
    }
  }
  return [];
}

/**
 * Find a project in the CMS by slug. Depth-first walk of queryCache to find
 * all projects, then return the one matching the slug.
 */
function findProjectBySlug(
  node: unknown,
  targetSlug: string,
  seen = new Set<object>()
): CmsProject | null {
  if (!node || typeof node !== "object") return null;
  if (seen.has(node as object)) return null;
  seen.add(node as object);

  const o = node as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const frontCover = resolveImageUrl(o.frontCover);

  if (title && frontCover) {
    const id = typeof o.id === "string" ? o.id : title;
    const slug = typeof o.slug === "string" ? o.slug : null;
    const project: CmsProject = {
      id,
      title,
      slug,
      frontCover,
      artists: resolveListField(o.artists),
      categories: resolveListField(o.categories),
      style: resolveListField(o.style),
      palette: resolveListField(o.palette),
      year:
        typeof o.year === "number"
          ? o.year
          : o.year
          ? Number(o.year) || null
          : null,
      date: typeof o.date === "string" ? o.date : null,
      createdAt: typeof o.createdAt === "string" ? o.createdAt : null,
    };

    const projectSlugValue = projectSlug(project);
    if (projectSlugValue === targetSlug) {
      return project;
    }
  }

  // Recurse into every value
  if (Array.isArray(node)) {
    for (const item of node) {
      const result = findProjectBySlug(item, targetSlug, seen);
      if (result) return result;
    }
  } else {
    for (const val of Object.values(o)) {
      const result = findProjectBySlug(val, targetSlug, seen);
      if (result) return result;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

interface ProjectDetailPageProps {
  project: CmsProject | null;
}

export default function ProjectDetailPage({
  project,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  if (!project) {
    return (
      <>
        <Head>
          <title>Not Found — ARTBYDANI7</title>
        </Head>
        <GlobalNav />
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
        <title>
          {project.title} — ARTBYDANI7
        </title>
        <meta name="description" content={`${project.title} by ${artistNames || "ARTBYDANI7"}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalNav />
      <div className={styles.archivePage}>
        <main style={{ maxWidth: "900px", margin: "0 auto", paddingTop: "40px" }}>
          <div style={{ marginBottom: "48px" }}>
            <Link href="/test" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "12px" }}>
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
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
              />
            ) : null}
          </div>

          {/* Metadata */}
          <div style={{ background: "var(--label)", border: "1px solid var(--line)", padding: "20px" }}>
            <h1 style={{ font: "700 20px/1.3 var(--font-mono)", textTransform: "uppercase", marginBottom: "12px" }}>
              {project.title}
            </h1>
            {artistNames && (
              <p style={{ font: "400 14px/1.4 var(--font-mono)", textTransform: "uppercase", color: "var(--muted)", marginBottom: "16px" }}>
                {artistNames}
              </p>
            )}
            {project.year && (
              <p style={{ font: "500 12px/1.4 var(--font-mono)", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                <strong>Year:</strong> {project.year}
              </p>
            )}
            {categories.length > 0 && (
              <p style={{ font: "500 12px/1.4 var(--font-mono)", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
                <strong>Categories:</strong> {categories.join(", ")}
              </p>
            )}
            {styles_list.length > 0 && (
              <p style={{ font: "500 12px/1.4 var(--font-mono)", textTransform: "uppercase", color: "var(--muted)", marginBottom: "8px" }}>
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
// Data fetching — fetch only the requested project
// ---------------------------------------------------------------------------

export const getServerSideProps: GetServerSideProps<ProjectDetailPageProps> =
  async ({ params }) => {
    const slug = params?.slug as string;
    if (!slug) {
      return { notFound: true };
    }

    const plasmicData = await PLASMIC.maybeFetchComponentData("/test");
    if (!plasmicData) {
      return { notFound: true };
    }

    const pageMeta = plasmicData.entryCompMetas[0];

    const queryCache = await extractPlasmicQueryData(
      <PlasmicRootProvider
        loader={PLASMIC}
        prefetchedData={plasmicData}
        pageRoute={pageMeta.path}
        pageParams={pageMeta.params}
      >
        <PlasmicComponent component={pageMeta.displayName} />
      </PlasmicRootProvider>
    );

    const project = findProjectBySlug(queryCache, slug);

    if (!project) {
      return { notFound: true };
    }

    return { props: { project } };
  };
