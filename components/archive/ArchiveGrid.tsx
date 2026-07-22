import { ArtworkCard } from "./ArtworkCard";
import styles from "./archive.module.css";
import { CmsProject } from "./types";

interface ArchiveGridProps {
  projects: CmsProject[];
  catalogueFor?: (project: CmsProject) => string;
  hrefFor?: (project: CmsProject) => string;
}

export function ArchiveGrid({ projects, catalogueFor, hrefFor }: ArchiveGridProps) {
  return (
    <section className={styles.grid} aria-live="polite" aria-label="Archive projects">
      {projects.map((project) => (
        <ArtworkCard
          key={project.id}
          {...project}
          catalogueNumber={catalogueFor?.(project)}
          href={hrefFor?.(project)}
        />
      ))}
    </section>
  );
}
