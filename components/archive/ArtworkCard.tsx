import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./archive.module.css";
import { CmsProject, asArray, projectSlug, valueLabel } from "./types";
import { getArchiveImageUrl } from "@/components/images/cloudinary";

export interface ArtworkCardProps extends Partial<CmsProject> {
  /** Zero-padded catalogue number, e.g. "007". */
  catalogueNumber?: string;
  /** Destination for the card link. Falls back to /projects/[slug]. */
  href?: string;
}

/* ── Inspection tuning ──────────────────────────────────────────────────────
   Deliberately tiny. The object should feel like it has weight and a real
   surface, never like a card that "pops". */
const MAX_TILT = 1.5; // degrees — total rotation range is ±1.5deg
const MAX_SHIFT = 3; // px — inner artwork parallax travel

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
  const cardRef = useRef<HTMLAnchorElement>(null);
  // Cached on pointerenter so pointermove never forces a layout read.
  const rectRef = useRef<DOMRect | null>(null);

  const artistNames = asArray(artists).map(valueLabel).filter(Boolean).join(", ");
  const destination = href || `/projects/${projectSlug({ slug, title, id })}`;

  /* ── Cursor-driven surface ────────────────────────────────────────────────
     Writes CSS custom properties straight to the element. This is purely
     event-driven — no requestAnimationFrame loop, no React state, so it
     never triggers a re-render and never schedules per-frame JS work.
     The CSS transitions do all the smoothing on the compositor. */

  const handlePointerEnter = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    rectRef.current = event.currentTarget.getBoundingClientRect();
  }, []);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLAnchorElement>) => {
    const node = cardRef.current;
    const rect = rectRef.current;
    if (!node || !rect) return;

    // Normalised cursor position within the card: -0.5 … 0.5
    const nx = (event.clientX - rect.left) / rect.width - 0.5;
    const ny = (event.clientY - rect.top) / rect.height - 0.5;

    // Tilt away from the cursor, as if the object is being angled to catch light.
    node.style.setProperty("--tilt-x", `${(-ny * MAX_TILT * 2).toFixed(3)}deg`);
    node.style.setProperty("--tilt-y", `${(nx * MAX_TILT * 2).toFixed(3)}deg`);

    // Inner artwork drifts a few pixels the opposite way for depth.
    node.style.setProperty("--shift-x", `${(-nx * MAX_SHIFT * 2).toFixed(2)}px`);
    node.style.setProperty("--shift-y", `${(-ny * MAX_SHIFT * 2).toFixed(2)}px`);

    // Specular highlight position — gallery lighting tracking the cursor.
    node.style.setProperty("--spec-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(2)}%`);
    node.style.setProperty("--spec-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(2)}%`);
  }, []);

  const handlePointerLeave = useCallback(() => {
    const node = cardRef.current;
    if (!node) return;
    rectRef.current = null;
    // Settle back to rest. The long CSS transition makes this unhurried.
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--shift-x", "0px");
    node.style.setProperty("--shift-y", "0px");
  }, []);

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
    <a
      className={styles.card}
      href={destination}
      ref={cardRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div className={styles.imageFrame} ref={imageFrameRef}>
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

        {/* Cursor-tracked specular sheen — position driven by --spec-x/--spec-y */}
        <span className={styles.specular} aria-hidden="true" />
        {/* Neutral veil used to soften neighbouring cards during inspection */}
        <span className={styles.veil} aria-hidden="true" />
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
