import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import { fetchCmsProjects } from "@/lib/cms";
import { EXHIBITIONS } from "@/components/curations/data";
import { resolveExhibition } from "@/components/curations/types";
import type { CurationExhibition } from "@/components/curations/types";
import { ExhibitionPage } from "@/components/curations/ExhibitionPage";
import type { CmsProject } from "@/components/archive/types";

export default function ExhibitionRoute({
  exhibition,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <>
      <Head>
        <title>{`${exhibition.number} — ${exhibition.title} | Curations — ARTBYDANI7`}</title>
        <meta
          name="description"
          content={exhibition.description[0] ?? `Exhibition ${exhibition.number}: ${exhibition.title}`}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ExhibitionPage exhibition={exhibition} />
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = EXHIBITIONS.map((e) => ({ params: { id: e.id } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<{
  exhibition: CurationExhibition;
}> = async ({ params }) => {
  const id = params?.id as string;
  const config = EXHIBITIONS.find((e) => e.id === id);

  if (!config) return { notFound: true };

  const projects: CmsProject[] = await fetchCmsProjects();
  const exhibition = resolveExhibition(config, projects);

  return { props: { exhibition }, revalidate: 3600 };
};
