import styles from "./archive.module.css";
import { CmsProject, valueLabel } from "./types";

export type ArtworkCardProps = CmsProject;

export function ArtworkCard({ title, frontCover, artists, year }: ArtworkCardProps) {
  const artistNames = artists.map(valueLabel).filter(Boolean).join(", ");

  return (
    <article className={styles.card}>
      <div className={styles.imageFrame}>
        {/* Plasmic CMS binding: projects.frontCover; host is intentionally CMS-defined. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={styles.cover} src={frontCover} alt={title} loading="lazy" />
      </div>
      <div className={styles.cardMeta}>
        <h2>{title}</h2>
        <p>{artistNames}</p>
        {year ? <p className={styles.year}>{year}</p> : null}
      </div>
    </article>
  );
}
