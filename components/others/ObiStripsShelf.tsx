import Link from "next/link";
import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";

export interface ObiStripsShelfProps {
  items: CmsOther[];
}

export function ObiStripsShelf({ items }: ObiStripsShelfProps) {
  if (items.length === 0) return null;

  return (
    <section className={styles.obiSection} aria-label="Obi strips shelf">
      {/* Section header */}
      <div className={styles.obiHeader}>
        <h2 className={styles.obiSectionTitle}>OBI STRIPS / SPINE ARCHIVE</h2>
        <span className={styles.obiCount}>{items.length} {items.length === 1 ? "Strip" : "Strips"}</span>
      </div>

      {/* Horizontal scrolling shelf */}
      <div className={styles.obiShelf} role="list">
        {items.map((item) => {
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

          return (
            <Link
              key={item.id}
              href={destination}
              className={styles.obiCard}
              role="listitem"
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
              <div className={styles.obiImageFrame}>
                {item.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className={styles.obiImage}
                    src={getOthersImageUrl(item.image)}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={styles.obiImageFallback} aria-hidden="true">
                    <span>No Image</span>
                  </div>
                )}
                {/* Reflection overlay */}
                <div className={styles.obiReflection} aria-hidden="true" />
              </div>

              <div className={styles.obiLabel}>
                <p className={styles.obiLabelTitle}>{item.title}</p>
                {item.type ? (
                  <p className={styles.obiLabelType}>{item.type}</p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
