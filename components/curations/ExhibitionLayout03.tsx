'use client';

import { useState } from 'react';
import { getProjectImageUrl } from '@/components/images/cloudinary';
import type { CurationExhibition } from './types';
import styles from './exhibition.module.css';

interface Props {
  exhibition: CurationExhibition;
}

export function ExhibitionLayout03({ exhibition }: Props) {
  const { works } = exhibition;
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (works.length === 0) return null;

  return (
    <section
      className={styles.glowSection}
      aria-label={`Artworks from ${exhibition.title}`}
    >
      {works.map((work, i) => {
        const src = getProjectImageUrl(work.imageUrl);
        const isHovered = hoveredIndex === i;
        return (
          <div
            key={`${work.project.id}-${i}`}
            className={`${styles.glowItem} ${isHovered ? styles.glowItemHovered : ''}`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className={styles.glowBloom} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={work.project.title}
              className={styles.glowImage}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
            />
          </div>
        );
      })}
    </section>
  );
}
