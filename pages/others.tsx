import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsOthers } from "@/lib/cms";
import { OthersPage } from "@/components/others/OthersPage";
import type { CmsOther } from "@/components/others/types";

export default function OthersRoute({
  items,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Others — ARTBYDANI7</title>
        <meta
          name="description"
          content="The wider creative archive of ARTBYDANI7 — posters, branding, logos, experiments and design artefacts."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <OthersPage items={items} />
    </>
  );
}

export const getStaticProps: GetStaticProps<{ items: CmsOther[] }> = async () => {
  const items = await fetchCmsOthers();
  return { props: { items }, revalidate: 3600 };
};
