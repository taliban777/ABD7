/**
 * Exhibition 03 — Bearers of the Beacon
 *
 * Large artwork presentation. On hover, a very slow white glow
 * builds from behind each artwork — pure CSS box-shadow transition (4s ease).
 *
 * Curation 03 specifics:
 *  - plans-of-the-diligent   → frontCover
 *  - right-over-left          → frontCover
 *  - right-over-left-2        → frontCover  (first entry)
 *  - right-over-left-2        → backCover   (second entry)
 * The imageUrl on each ExhibitionWork already reflects these choices.
 */

import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout03({ exhibition }: Props) {
  const { works } = exhibition;

  if (works.length === 0) return null;

  return (
    <section
      className={styles.glowSection}
      aria-label={`Artworks from ${exhibition.title}`}
    >
      {works.map((work, i) => {
        const src = getProjectImageUrl(work.imageUrl);
        return (
          <div key={`${work.project.id}-${i}`} className={styles.glowItem}>
            <div className={styles.glowImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={work.project.title}
                className={styles.glowImage}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
