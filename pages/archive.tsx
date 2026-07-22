import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { PlasmicComponent, PlasmicRootProvider } from "@plasmicapp/loader-nextjs";
import { PLASMIC } from "@/plasmic-init";

export default function ArchiveRoute({ plasmicData }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>Archive — ARTBYDANI7</title>
        <meta name="description" content="The ARTBYDANI7 project archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <PlasmicRootProvider loader={PLASMIC} prefetchedData={plasmicData}>
        <PlasmicComponent component="Archive" />
      </PlasmicRootProvider>
    </>
  );
}

export const getStaticProps: GetStaticProps<{ plasmicData: unknown }> = async () => {
  const plasmicData = await PLASMIC.maybeFetchComponentData("Archive");
  if (!plasmicData) return { notFound: true };
  return { props: { plasmicData }, revalidate: 3600 };
};
