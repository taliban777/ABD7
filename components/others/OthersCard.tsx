import Link from "next/link";
import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";

export interface OthersCardProps {
  item: CmsOther;
  /** "grid" renders the card with a fixed 4:5 image aspect ratio for uniform cells */
  variant?: "masonry" | "grid";
}

export function OthersCard({ item, variant = "masonry" }: OthersCardProps) {
  const destination = `/others/${otherSlug(item)}`;

  const reflectionSeed = (item.id || item.title)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reflectionDuration = 900 + ((reflectionSeed * 347) % 300);
  const reflectionDirection = reflectionSeed % 2;
  const startX = reflectionDirection === 0 ? -100 : 100;
  const endX = reflectionDirection === 0 ? 100 : -100;
  const startY = ((reflectionSeed * 73) % 40) - 20;
  const endY = -startY;

  const isGrid = variant === "grid";

  return (
    <Link
      href={destination}
      className={`${styles.card} ${isGrid ? styles.cardGrid : ""}`}
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
      <div className={`${styles.imageFrame} ${isGrid ? styles.imageFrameGrid : ""}`}>
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
