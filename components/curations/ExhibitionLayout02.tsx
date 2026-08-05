/**
 * Exhibition 02 — Change How You Perceive Space.
 *
 * Three artworks in a vertical architectural composition.
 * Each artwork is accompanied by a mono axis label on the left,
 * written vertically.
 */

import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./exhibition.module.css";

interface Props {
  exhibition: CurationExhibition;
}

const FALLBACK_LABELS = [
  "[AXIS // 01: THRESHOLD]",
  "[AXIS // 02: REPOSE]",
  "[AXIS // 03: MONUMENT]",
];

export function ExhibitionLayout02({ exhibition }: Props) {
  const { works, axisLabels } = exhibition;
  const labels = axisLabels?.length ? axisLabels : FALLBACK_LABELS;

  if (works.length === 0) return null;

  return (
    <section
      className={styles.verticalSection}
      aria-label={`Artworks from ${exhibition.title}`}
    >
      {works.map((work, i) => {
        const src = getProjectImageUrl(work.imageUrl);
        const label = labels[i] ?? `[AXIS // ${String(i + 1).padStart(2, "0")}]`;

        return (
          <div key={`${work.project.id}-${i}`} className={styles.verticalItem}>
            <span className={styles.verticalAxisLabel} aria-hidden="true">
              {label}
            </span>
            <div className={styles.verticalImageWrap}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={work.project.title}
                className={styles.verticalImage}
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
