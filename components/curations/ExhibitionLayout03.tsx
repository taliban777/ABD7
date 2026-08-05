/**
 * Exhibition 03 — Bearers of the Beacon
 *
 * Large artwork presentation. On hover, a very slow white glow
 * builds from behind each artwork — pure CSS box-shadow transition
 * with a 4s ease. No JS, no canvas.
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
        const src = getProjectImageUrl(work.frontCover);
        return (
          <div key={work.id} className={styles.glowItem}>
            <div className={styles.glowImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={work.title}
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
