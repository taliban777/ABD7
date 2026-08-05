/**
 * Exhibition 04 — Vessels of the Unseen (The Mali Selections)
 *
 * Vol.1 and Vol.2 sit side by side.
 * Vol.3 spans the full width beneath them.
 * All three use frontCover (resolved by imageKey in data.ts).
 */

import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout04({ exhibition }: Props) {
  const { works } = exhibition;

  const vol1 = works[0];
  const vol2 = works[1];
  const vol3 = works[2];

  if (!vol1) return null;

  return (
    <section
      className={styles.maliSection}
      aria-label={`Artworks from ${exhibition.title}`}
    >
      {/* Vol 1 + Vol 2 side by side */}
      {(vol1 || vol2) && (
        <div className={styles.maliRow}>
          {vol1 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getProjectImageUrl(vol1.imageUrl)}
              alt={vol1.project.title}
              className={styles.maliImage}
              loading="eager"
              decoding="async"
            />
          )}
          {vol2 && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getProjectImageUrl(vol2.imageUrl)}
              alt={vol2.project.title}
              className={styles.maliImage}
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      )}

      {/* Vol 3 — full width */}
      {vol3 && (
        <div className={styles.maliFullRow}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProjectImageUrl(vol3.imageUrl)}
            alt={vol3.project.title}
            className={styles.maliImage}
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
    </section>
  );
}
