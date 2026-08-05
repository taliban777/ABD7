import Link from "next/link";
import { ArtworkCard } from "./ArtworkCard";
import styles from "./archive.module.css";
import { CmsProject, asArray, valueLabel } from "./types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

interface ArchiveGridProps {
  projects: CmsProject[];
  viewMode?: "grid" | "list";
  catalogueFor?: (project: CmsProject) => string;
  hrefFor?: (project: CmsProject) => string;
}

export function ArchiveGrid({
  projects,
  viewMode = "grid",
  catalogueFor,
  hrefFor,
}: ArchiveGridProps) {
  if (viewMode === "list") {
    return (
      <nav
        className={styles.gridList}
        aria-live="polite"
        aria-label="Archive projects"
      >
        {projects.map((project, i) => {
          const href = hrefFor?.(project) ?? `/projects/${project.slug ?? project.id}`;
          const catalogue = catalogueFor?.(project) ?? "";
          const artistNames = asArray(project.artists).map(valueLabel).filter(Boolean).join(", ");

          return (
            <Link
              key={project.id}
              href={href}
              className={styles.listRow}
              style={{ "--card-index": i } as React.CSSProperties}
            >
              {/* Small thumbnail */}
              <div className={styles.listThumb}>
                {project.frontCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.listThumbImg}
                    src={getArchiveImageUrl(project.frontCover)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </div>

              {/* Title + artist */}
              <div className={styles.listMeta}>
                <p className={styles.listTitle}>{project.title}</p>
                {artistNames && (
                  <p className={styles.listArtist}>{artistNames}</p>
                )}
              </div>

              {/* Year */}
              {project.year ? (
                <span className={styles.listYear}>{project.year}</span>
              ) : null}

              {/* Catalogue number */}
              {catalogue ? (
                <span className={styles.listCatalogue}>No.&nbsp;{catalogue}</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <section
      className={styles.grid}
      aria-live="polite"
      aria-label="Archive projects"
    >
      {projects.map((project, i) => (
        <ArtworkCard
          key={project.id}
          {...project}
          catalogueNumber={catalogueFor?.(project)}
          href={hrefFor?.(project)}
          index={i}
        />
      ))}
    </section>
  );
}
