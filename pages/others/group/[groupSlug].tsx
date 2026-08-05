import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsOthers, fetchCmsOthersByGroup } from "@/lib/cms";
import type { CmsOther } from "@/components/others/types";
import { projectLabel } from "@/components/others/types";
import { GlobalNav } from "@/components/nav/GlobalNav";
import { OthersGroupPage } from "@/components/others/OthersGroupPage";

export default function OthersGroupRoute({
  groupSlug,
  items,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const title = projectLabel(groupSlug);

  if (!items || items.length === 0) {
    return (
      <>
        <Head>
          <title>Not Found — ARTBYDANI7</title>
        </Head>
        <GlobalNav projects={[]} />
        <div style={{ minHeight: "100vh", padding: "80px 24px" }}>
          <p>Group not found.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{title} — ARTBYDANI7</title>
        <meta
          name="description"
          content={`${title} — a grouped collection of ${items.length} entries from the ARTBYDANI7 archive.`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <GlobalNav projects={[]} />
      <OthersGroupPage groupSlug={groupSlug} items={items} />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const items = await fetchCmsOthers();
  const groups = Array.from(
    new Set(items.map((item) => item.groupSlug).filter(Boolean))
  );
  const paths = groups.map((groupSlug) => ({ params: { groupSlug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<{
  groupSlug: string;
  items: CmsOther[];
}> = async ({ params }) => {
  const groupSlug = params?.groupSlug as string;
  if (!groupSlug) return { notFound: true };

  const items = await fetchCmsOthersByGroup(groupSlug);
  if (items.length === 0) return { notFound: true };

  return { props: { groupSlug, items }, revalidate: 3600 };
};
