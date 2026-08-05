import Link from "next/link";
import { getProjectImageUrl } from "@/components/images/cloudinary";
import type { CurationExhibition } from "./types";
import styles from "./curations.module.css";

interface CurationsIndexCardProps {
  exhibition: CurationExhibition;
}

export function CurationsIndexCard({ exhibition }: CurationsIndexCardProps) {
  const previewWork = exhibition.works[0];
  const previewSrc = previewWork ? getProjectImageUrl(previewWork.frontCover) : null;

  return (
    <li className={styles.exhibitionItem}>
      <Link href={`/curations/${exhibition.id}`} className={styles.exhibitionLink}>
        {/* Number */}
        <span className={styles.exhibitionNumber} aria-hidden="true">
          {exhibition.number}
        </span>

        {/* Text block */}
        <div className={styles.exhibitionText}>
          <h2 className={styles.exhibitionTitle}>{exhibition.title}</h2>
          {exhibition.subtitle && (
            <p className={styles.exhibitionSubtitle}>{exhibition.subtitle}</p>
          )}
          {exhibition.description[0] && (
            <p className={styles.exhibitionDesc}>{exhibition.description[0]}</p>
          )}
          <span className={styles.enterLink} aria-label={`Enter Exhibition ${exhibition.number}: ${exhibition.title}`}>
            Enter Exhibition →
          </span>
        </div>

        {/* Preview image — hidden on small screens via CSS */}
        {previewSrc && (
          <div className={styles.exhibitionPreview} aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewSrc}
              alt=""
              className={styles.exhibitionPreviewImg}
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
      </Link>
    </li>
  );
}
