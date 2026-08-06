import { useState } from "react";
import styles from "./archive.module.css";
import { CmsProject, asArray, projectSlug, valueLabel } from "./types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

export interface ArtworkCardProps extends Partial<CmsProject> {
  /** Zero-padded catalogue number, e.g. "007". */
  catalogueNumber?: string;
  /** Destination for the card link. Falls back to /projects/[slug]. */
  href?: string;
  /** Animation stagger index for entry animation. */
  index?: number;
}

export function ArtworkCard({
  id = "",
  title = "Untitled",
  slug,
  frontCover = "",
  artists = [],
  categories = [],
  year,
  catalogueNumber = "",
  href,
  index = 0,
}: ArtworkCardProps) {
  const [loaded, setLoaded] = useState(false);

  const artistNames = asArray(artists).map(valueLabel).filter(Boolean).join(", ");
  const primaryCategory = asArray(categories).map(valueLabel).filter(Boolean)[0] ?? null;
  const destination = href || `/projects/${projectSlug({ slug, title, id })}`;

  // Generate deterministic but randomised reflection variables based on card ID
  const reflectionSeed = (id || title).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reflectionDuration = 900 + ((reflectionSeed * 347) % 300);
  const reflectionDirection = reflectionSeed % 2;
  const startX = reflectionDirection === 0 ? -100 : 100;
  const endX = reflectionDirection === 0 ? 100 : -100;
  const startY = ((reflectionSeed * 73) % 40) - 20;
  const endY = -startY;

  return (
    <a
      className={`${styles.card} w-fit mx-auto`}
      href={destination}
      style={{ "--card-index": index } as React.CSSProperties}
    >
      <div
        className={styles.imageFrame}
        style={
          {
            "--reflection-duration": `${reflectionDuration}ms`,
            "--reflection-start": `${startX}%`,
            "--reflection-end": `${endX}%`,
            "--reflection-y-start": `${startY}%`,
            "--reflection-y-end": `${endY}%`,
          } as React.CSSProperties
        }
      >
        {frontCover ? (
          // Plasmic CMS binding: projects.frontCover; host is intentionally CMS-defined.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={`w-full h-auto block aspect-square object-cover ${styles.cover} ${loaded ? styles.coverLoaded : ""}`}
            src={getArchiveImageUrl(frontCover)}
            alt={title}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        ) : (
          <div className={styles.coverFallback} aria-hidden="true">
            <span>No Image</span>
          </div>
        )}
      </div>

      {/* White gallery catalogue label */}
      <div className={`${styles.label} w-full`}>
        <div className={styles.labelTop}>
          {catalogueNumber ? (
            <span className={styles.catNumber}>No.&nbsp;{catalogueNumber}</span>
          ) : (
            <span />
          )}
          {year ? <span className={styles.labelYear}>{year}</span> : null}
        </div>
        <h2 className={styles.labelTitle}>{title}</h2>
        <div className={styles.labelBottom}>
          <p className={styles.labelArtist}>{artistNames || "Unattributed"}</p>
        </div>
      </div>
    </a>
  );
}
