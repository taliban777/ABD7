import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsOthers, fetchCmsOtherBySlug } from "@/lib/cms";
import type { CmsOther } from "@/components/others/types";
import { otherSlug } from "@/components/others/types";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { OtherDetailPage } from "@/components/others/OtherDetailPage";

export default function OtherPage({
  item,
  allItems,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  if (!item) {
    return (
      <>
        <Head>
          <title>Not Found — ARTBYDANI7</title>
        </Head>
        <GlobalNav projects={[]} />
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
      </Head>
      <GlobalNav projects={[]} />
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
}> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const [item, allItems] = await Promise.all([
    fetchCmsOtherBySlug(slug),
    fetchCmsOthers(),
  ]);

  if (!item) return { notFound: true };

  return { props: { item, allItems }, revalidate: 3600 };
};
