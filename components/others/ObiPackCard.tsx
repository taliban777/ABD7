import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";
import Link from "next/link";

export interface ObiPackCardProps {
  items: CmsOther[];
}

/**
 * Renders up to 3 obi strips side-by-side in a single grid cell.
 * The frame constrains max-height so strips scale down uniformly
 * while preserving their natural (tall, narrow) aspect ratios.
 * Each strip links independently to its detail page.
 */
export function ObiPackCard({ items }: ObiPackCardProps) {
  if (items.length === 0) return null;

  return (
    <div className={styles.obiPackCard}>
      <div className={styles.obiPackFrame}>
        {items.map((item) => {
          const destination = `/others/${otherSlug(item)}`;
          return (
            <Link
              key={item.id}
              href={destination}
              className={styles.obiPackStrip}
              title={item.title}
            >
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className={styles.obiPackStripImage}
                  src={getOthersImageUrl(item.image)}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className={styles.obiPackStripFallback} aria-hidden="true">
                  <span>{item.title.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
      <div className={styles.label}>
        <h2 className={styles.labelTitle}>
          {items[0].title}
          {items.length > 1 ? ` +${items.length - 1}` : ""}
        </h2>
        <p className={styles.labelType}>
          Obi Strip · {items.length} {items.length === 1 ? "piece" : "pieces"}
        </p>
      </div>
    </div>
  );
}
