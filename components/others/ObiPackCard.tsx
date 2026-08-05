import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";
import Link from "next/link";

export interface ObiPackCardProps {
  items: CmsOther[];
}

/**
 * Renders 3–4 obi strips side-by-side inside a single grid cell.
 * The container uses aspect-ratio 3/4 and a warm cream background
 * so the pack reads like physical strips laid on a gallery desk.
 * Each strip links to its own detail page.
 */
export function ObiPackCard({ items }: ObiPackCardProps) {
  if (items.length === 0) return null;

  return (
    <div className={styles.obiPackCard}>
      <div
        className={styles.obiPackFrame}
        style={{ "--obi-pack-count": items.length } as React.CSSProperties}
      >
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

      {/* Pack label — title of first item + count */}
      <div className={styles.label}>
        <h2 className={styles.labelTitle}>
          {items[0].title}
          {items.length > 1 ? ` +${items.length - 1}` : ""}
        </h2>
        <p className={styles.labelType}>Obi Strip · {items.length} {items.length === 1 ? "piece" : "pieces"}</p>
      </div>
    </div>
  );
}
