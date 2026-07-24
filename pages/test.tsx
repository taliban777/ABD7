import type { GetServerSideProps, InferGetServerSidePropsType } from "next";
import Head from "next/head";
import { ArchivePage } from "@/components/archive/ArchivePage";
import type { CmsProject } from "@/components/archive/types";

export default function TestArchiveRoute({ projects }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Archive — ARTBYDANI7</title>
        <meta name="description" content="The ARTBYDANI7 project archive." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <ArchivePage projects={projects} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps<{ projects: CmsProject[] }> = async () => {
  // Temporary: return mock projects while CMS integration is set up
  const mockProjects: CmsProject[] = [
    {
      id: "1",
      title: "Everything Beautiful Died Early",
      slug: "everything-beautiful-died-early",
      frontCover: "https://via.placeholder.com/400x400?text=Everything+Beautiful",
      artists: ["ARTBYDANI7"],
      categories: ["Art Direction"],
      style: ["Contemporary"],
      palette: ["Neutral"],
      year: 2024,
      date: "2024-01-15",
    },
    {
      id: "2",
      title: "Wavo Forever",
      slug: "wavo-forever",
      frontCover: "https://via.placeholder.com/400x400?text=Wavo+Forever",
      artists: ["ARTBYDANI7"],
      categories: ["Design"],
      style: ["Digital"],
      palette: ["Blue"],
      year: 2024,
      date: "2024-02-20",
    },
    {
      id: "3",
      title: "WaveGhxst",
      slug: "waveghxst",
      frontCover: "https://via.placeholder.com/400x400?text=WaveGhxst",
      artists: ["ARTBYDANI7"],
      categories: ["Visual"],
      style: ["Abstract"],
      palette: ["Purple"],
      year: 2024,
      date: "2024-03-10",
    },
    {
      id: "4",
      title: "Code of Honor",
      slug: "code-of-honor",
      frontCover: "https://via.placeholder.com/400x400?text=Code+of+Honor",
      artists: ["ARTBYDANI7"],
      categories: ["Concept"],
      style: ["Minimal"],
      palette: ["Black"],
      year: 2024,
      date: "2024-04-05",
    },
  ];
  
  return { props: { projects: mockProjects } };
};
