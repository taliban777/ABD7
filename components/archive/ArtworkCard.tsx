import styles from "./archive.module.css";
import { CmsProject, asArray, projectSlug, valueLabel } from "./types";

export interface ArtworkCardProps extends Partial<CmsProject> {
  /** Zero-padded catalogue number, e.g. "007". */
  catalogueNumber?: string;
  /** Destination for the card link. Falls back to /projects/[slug]. */
  href?: string;
}

export function ArtworkCard({
  id = "",
  title = "Untitled",
  slug,
  frontCover = "",
  artists = [],
  year,
  catalogueNumber = "",
  href,
}: ArtworkCardProps) {
  const artistNames = asArray(artists).map(valueLabel).filter(Boolean).join(", ");
  const destination = href || `/projects/${projectSlug({ slug, title, id })}`;

  return (
    <a className={styles.card} href={destination}>
      <div className={styles.imageFrame}>
        {frontCover ? (
          // Plasmic CMS binding: projects.frontCover; host is intentionally CMS-defined.
          // eslint-disable-next-line @next/next/no-img-element
          <img className={styles.cover} src={frontCover} alt={title} loading="lazy" />
        ) : (
          <div className={styles.coverFallback} aria-hidden="true">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* White gallery catalogue label */}
      <div className={styles.label}>
        <div className={styles.labelTop}>
          {catalogueNumber ? <span className={styles.catNumber}>No. {catalogueNumber}</span> : <span />}
          {year ? <span className={styles.labelYear}>{year}</span> : null}
        </div>
        <h2 className={styles.labelTitle}>{title}</h2>
        <p className={styles.labelArtist}>{artistNames || "Unattributed"}</p>
      </div>
    </a>
  );
}
