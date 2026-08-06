import type { CurationExhibition } from "./types";
import { CurationsIndexCard } from "./CurationsIndexCard";
import styles from "./curations.module.css";
import { GlobalNav } from "@/components/nav/GlobalNav";
import type { CmsProject } from "@/components/archive/types";

interface CurationsPageProps {
  exhibitions: CurationExhibition[];
  projects?: CmsProject[];
}

export function CurationsPage({ exhibitions, projects = [] }: CurationsPageProps) {
  return (
    <>
    <GlobalNav projects={projects} />
    <main className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.pageTitle}>Curations</h1>
        <p className={styles.intro}>
          Five curated readings of the archive.
          <br />
          Each exhibition proposes a different way of seeing.
        </p>
      </header>

      <div className={styles.headerRule} aria-hidden="true" />

      {/* Exhibition list */}
      <ol className={styles.exhibitionList} aria-label="Curated exhibitions">
        {exhibitions.map((exhibition) => (
          <CurationsIndexCard key={exhibition.id} exhibition={exhibition} />
        ))}
      </ol>
    </main>
    </>
  );
}
