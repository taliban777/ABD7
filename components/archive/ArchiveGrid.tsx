import { ArtworkCard } from "./ArtworkCard";
import styles from "./archive.module.css";
import { CmsProject } from "./types";

interface ArchiveGridProps {
  projects: CmsProject[];
}

export function ArchiveGrid({ projects }: ArchiveGridProps) {
  return (
    <section className={styles.grid} aria-live="polite" aria-label="Archive projects">
      {projects.map((project) => (
        <ArtworkCard key={project.id} {...project} />
      ))}
    </section>
  );
}
