"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import styles from "./others.module.css";
import type { CmsOther } from "./types";
import { otherSlug } from "./types";
import { getOthersImageUrl } from "@/components/images/cloudinary";

// Images taller than this ratio (h/w) get a tight-width card.
// OBI strips are ~4.8; normal artwork sits between 0.5–1.5.
const TALL_RATIO_THRESHOLD = 2;

export interface OthersCardProps {
  item: CmsOther;
}

export function OthersCard({ item }: OthersCardProps) {
  const destination = `/others/${otherSlug(item)}`;
  const cardRef = useRef<HTMLAnchorElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const reflectionSeed = (item.id || item.title)
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const reflectionDuration = 900 + ((reflectionSeed * 347) % 300);
  const reflectionDirection = reflectionSeed % 2;
  const startX = reflectionDirection === 0 ? -100 : 100;
  const endX = reflectionDirection === 0 ? 100 : -100;
  const startY = ((reflectionSeed * 73) % 40) - 20;
  const endY = -startY;

  // Once the image loads, read its intrinsic dimensions. For tall images
  // (ratio > threshold) add a CSS class that constrains the card width to
  // the image's intrinsic width at the capped height, eliminating the
  // letterbox background that would otherwise appear on the sides.
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const { naturalWidth, naturalHeight } = img;
      if (!naturalWidth || !frameRef.current || !cardRef.current) return;
      const ratio = naturalHeight / naturalWidth;
      if (ratio > TALL_RATIO_THRESHOLD) {
        // Derive the rendered image width from the capped height.
        // The CSS max-height cap at 3 cols = 60vw. At the moment the image
        // loads we can read the actual rendered height from the frame and
        // back-calculate the correct pixel width directly.
        const frameHeight = frameRef.current.getBoundingClientRect().height;
        const targetWidth = Math.round(frameHeight / ratio);
        cardRef.current.style.width = `${targetWidth}px`;
      }
    },
    []
  );

  return (
    <Link ref={cardRef} href={destination} className={styles.card}>
      <div
        ref={frameRef}
        className={styles.imageFrame}
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
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.image}
            src={getOthersImageUrl(item.image)}
            alt={item.title}
            loading="lazy"
            decoding="async"
            onLoad={handleImageLoad}
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
