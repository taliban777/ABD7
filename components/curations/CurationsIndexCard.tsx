import Link from "next/link";
import type { CurationExhibition } from "./types";
import styles from "./curations.module.css";

interface CurationsIndexCardProps {
  exhibition: CurationExhibition;
}

export function CurationsIndexCard({ exhibition }: CurationsIndexCardProps) {
  const workCount = exhibition.works.length;

  return (
    <li className={styles.exhibitionItem}>
      <Link href={`/curations/${exhibition.id}`} className={styles.exhibitionLink}>
        {/* Number column */}
        <span className={styles.exhibitionNumber} aria-hidden="true">
          {exhibition.number}
        </span>

        {/* Text column */}
        <div className={styles.exhibitionText}>
          <h2 className={styles.exhibitionTitle}>{exhibition.title}</h2>
          {exhibition.subtitle && (
            <p className={styles.exhibitionSubtitle}>{exhibition.subtitle}</p>
          )}
          {exhibition.description[0] && (
            <p className={styles.exhibitionDesc}>{exhibition.description[0]}</p>
          )}
          <div className={styles.exhibitionMeta}>
            {workCount > 0 && (
              <span className={styles.exhibitionCount}>
                {workCount} {workCount === 1 ? "work" : "works"}
              </span>
            )}
            <span className={styles.enterLink} aria-label={`Enter Exhibition ${exhibition.number}: ${exhibition.title}`}>
              Enter Exhibition →
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
