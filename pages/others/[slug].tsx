import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsOthers, fetchCmsProjects } from "@/lib/cms";
import type { CmsOther } from "@/components/others/types";
import type { CmsProject } from "@/components/archive/types";
import { otherSlug } from "@/components/others/types";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { OtherDetailPage } from "@/components/others/OtherDetailPage";

export default function OtherPage({
  item,
  allItems,
  projects,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!item) {
    return (
      <>
        <Head>
          <title>Not Found — ARTBYDANI7</title>
        </Head>
        <GlobalNav projects={projects} />
        <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
          <p>Entry not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{item.title} — ARTBYDANI7</title>
        <meta
          name="description"
          content={`${item.title}${item.type ? ` — ${item.type}` : ""}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://artbydani7.com/others/${otherSlug(item)}`} />
        <meta property="og:title" content={`${item.title} — ARTBYDANI7`} />
        <meta property="og:description" content={`${item.title}${item.type ? ` — ${item.type}` : ""}`} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://artbydani7.com/others/${otherSlug(item)}`} />
        <meta property="og:image" content="https://artbydani7.com/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${item.title} — ARTBYDANI7`} />
        <meta name="twitter:description" content={`${item.title}${item.type ? ` — ${item.type}` : ""}`} />
        <meta name="twitter:image" content="https://artbydani7.com/og-image.png" />
      </Head>
      <GlobalNav projects={projects} />
      <OtherDetailPage item={item} allItems={allItems} />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const items = await fetchCmsOthers();
  const paths = items
    .filter((item) => otherSlug(item))
    .map((item) => ({ params: { slug: otherSlug(item) } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<{
  item: CmsOther | null;
  allItems: CmsOther[];
  projects: CmsProject[];
}> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  // Fetch allItems and projects concurrently; derive item from allItems
  // to avoid a redundant fetchCmsOthers() call inside fetchCmsOtherBySlug.
  const [allItems, projects] = await Promise.all([
    fetchCmsOthers(),
    fetchCmsProjects(),
  ]);
  const item = allItems.find((i) => otherSlug(i) === slug) ?? null;

  if (!item) return { notFound: true };

  return { props: { item, allItems, projects }, revalidate: 3600 };
};
