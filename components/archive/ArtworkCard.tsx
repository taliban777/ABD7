import { useEffect, useRef, useState } from "react";
import styles from "./archive.module.css";
import { CmsProject, asArray, projectSlug, valueLabel } from "./types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

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
  const [imageSrc, setImageSrc] = useState<string>("");
  const imageFrameRef = useRef<HTMLDivElement>(null);

  const artistNames = asArray(artists).map(valueLabel).filter(Boolean).join(", ");
  const destination = href || `/projects/${projectSlug({ slug, title, id })}`;

  // Generate deterministic but randomized reflection variables based on card ID
  const reflectionSeed = (id || title).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reflectionDuration = 900 + ((reflectionSeed * 347) % 300); // 900-1200ms
  const reflectionDirection = reflectionSeed % 2; // 0 or 1 for different directions
  const startX = reflectionDirection === 0 ? -100 : 100;
  const endX = reflectionDirection === 0 ? 100 : -100;
  const startY = ((reflectionSeed * 73) % 40) - 20; // -20 to 20
  const endY = -startY; // Opposite direction

  // Lazy load image when card enters viewport
  useEffect(() => {
    if (!frontCover || !imageFrameRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(getArchiveImageUrl(frontCover));
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(imageFrameRef.current);
    return () => observer.disconnect();
  }, [frontCover]);

  return (
    <a className={styles.card} href={destination}>
      <div
        className={styles.imageFrame}
        ref={imageFrameRef}
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
        {imageSrc && frontCover ? (
          // Plasmic CMS binding: projects.frontCover; host is intentionally CMS-defined.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.cover}
            src={imageSrc}
            alt={title}
            loading="lazy"
            decoding="async"
          />
        ) : frontCover ? (
          <div className={styles.coverLoading} aria-hidden="true" />
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
