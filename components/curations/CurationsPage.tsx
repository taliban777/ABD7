import type { CurationExhibition } from "./types";
import { CurationsIndexCard } from "./CurationsIndexCard";
import styles from "./curations.module.css";

interface CurationsPageProps {
  exhibitions: CurationExhibition[];
}

export function CurationsPage({ exhibitions }: CurationsPageProps) {
  return (
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
  );
}
