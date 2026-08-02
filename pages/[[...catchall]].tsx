import * as React from "react";
import {
  PlasmicComponent,
  extractPlasmicQueryData,
  ComponentRenderData,
  PlasmicRootProvider,
} from "@plasmicapp/loader-nextjs";
import type { GetStaticPaths, GetStaticProps } from "next";

import Error from "next/error";
import { useRouter } from "next/router";
import Head from "next/head";
import HomePage from "@/components/home/HomePage";
import { IndexPage } from "@/components/index-page/IndexPage";
import { PLASMIC } from "@/plasmic-init";
import { fetchCmsProjects } from "@/lib/cms";
import type { CmsProject } from "@/components/archive/types";

export default function PlasmicLoaderPage(props: {
  plasmicData?: ComponentRenderData;
  queryCache?: Record<string, unknown>;
  isHomepage?: boolean;
  isIndexPage?: boolean;
  projects?: CmsProject[];
}) {
  const { plasmicData, queryCache, isHomepage, isIndexPage, projects = [] } = props;
  const router = useRouter();

  if (isHomepage) {
    return (
      <>
        <Head>
          <title>ARTBYDANI7</title>
          <meta name="description" content="Independent art direction and visual archive." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <HomePage projects={projects} />
      </>
    );
  }

  if (isIndexPage) {
    return (
      <>
        <Head>
          <title>Index — ARTBYDANI7</title>
          <meta name="description" content="A typographic inventory of the ARTBYDANI7 archive." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <IndexPage projects={projects} />
      </>
    );
  }

  if (!plasmicData || plasmicData.entryCompMetas.length === 0) {
    return <Error statusCode={404} />;
  }
  const pageMeta = plasmicData.entryCompMetas[0];
  return (
    <PlasmicRootProvider
      loader={PLASMIC}
      prefetchedData={plasmicData}
      prefetchedQueryData={queryCache}
      pageRoute={pageMeta.path}
      pageParams={pageMeta.params}
      pageQuery={router.query}
    >
      <PlasmicComponent component={pageMeta.displayName} />
    </PlasmicRootProvider>
  );
}

export const getStaticProps: GetStaticProps = async (context) => {
  const { catchall } = context.params ?? {};
  const isHomepage = !catchall || (Array.isArray(catchall) && catchall.length === 0);

  if (isHomepage) {
    const projects = await fetchCmsProjects();
    return { props: { isHomepage: true, projects }, revalidate: 3600 };
  }

  const plasmicPath =
    typeof catchall === "string"
      ? catchall
      : Array.isArray(catchall)
      ? `/${catchall.join("/")}`
      : "/";

  // Special handling for /catalogue: render as IndexPage instead of Plasmic component
  if (plasmicPath === "/catalogue") {
    const projects = await fetchCmsProjects();
    return { props: { isIndexPage: true, projects }, revalidate: 3600 };
  }

  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

  if (!plasmicData) {
    return { props: {} };
  }

  const pageMeta = plasmicData.entryCompMetas[0];
  const queryCache = await extractPlasmicQueryData(
    React.createElement(
      PlasmicRootProvider,
      {
        loader: PLASMIC,
        prefetchedData: plasmicData,
        pageRoute: pageMeta.path,
        pageParams: pageMeta.params,
      },
      React.createElement(PlasmicComponent, { component: pageMeta.displayName })
    )
  );
  return { props: { plasmicData, queryCache }, revalidate: 60 };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const pageModules = await PLASMIC.fetchPages();
  const EXCLUDED = new Set(["/archive", "/test", "/contact", "/colophon", "/collection"]);

  const paths = pageModules
    .filter((mod) => !EXCLUDED.has(mod.path))
    .map((mod) => ({
      params: {
        catchall: mod.path.substring(1).split("/"),
      },
    }));

  // Explicitly include /catalogue as a static path
  paths.push({ params: { catchall: ["catalogue"] } });

  return { paths, fallback: "blocking" };
};
