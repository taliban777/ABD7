import Link from "next/link";
import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug, isObiStrip } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";

export interface OthersCardProps {
  item: CmsOther;
  /**
   * When true the card always links to the individual entry page,
   * bypassing the group route. Used inside a group view so items can
   * still be opened individually.
   */
  linkToItem?: boolean;
}

export function OthersCard({ item, linkToItem = false }: OthersCardProps) {
  // Cards on the /others index route to the shared group page when the
  // entry belongs to a CMS group; otherwise they open the individual entry.
  const destination =
    !linkToItem && item.groupSlug
      ? `/others/group/${item.groupSlug}`
      : `/others/${otherSlug(item)}`;

  const obi = isObiStrip(item);

  const reflectionSeed = (item.id || item.title)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reflectionDuration = 900 + ((reflectionSeed * 347) % 300);
  const reflectionDirection = reflectionSeed % 2;
  const startX = reflectionDirection === 0 ? -100 : 100;
  const endX = reflectionDirection === 0 ? 100 : -100;
  const startY = ((reflectionSeed * 73) % 40) - 20;
  const endY = -startY;

  return (
    <Link
      href={destination}
      className={`${styles.card} ${obi ? styles.cardObi : ""}`}
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
      <div className={styles.imageFrame}>
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.image}
            src={getOthersImageUrl(item.image)}
            alt={item.title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={styles.imageFallback} aria-hidden="true">
            <span>No Image</span>
          </div>
        )}
      </div>

      <div className={styles.label}>
        <h2 className={styles.labelTitle}>{item.title}</h2>
        {item.type ? <p className={styles.labelType}>{item.type}</p> : null}
      </div>
    </Link>
  );
}
