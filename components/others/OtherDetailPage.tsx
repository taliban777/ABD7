'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CmsOther } from './types';
import { otherSlug } from './types';
import { getOthersHeroImageUrl, getOthersGalleryThumbUrl } from '@/components/images/cloudinary';
import styles from './others.module.css';

export interface OtherDetailPageProps {
  item: CmsOther;
  allItems: CmsOther[];
}

export function OtherDetailPage({ item, allItems }: OtherDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const galleryImages = useMemo(() => item.gallery ?? [], [item.gallery]);

  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    if (item.image) {
      images.push({ url: item.image, alt: `${item.title} — Main` });
    }
    for (let i = 0; i < galleryImages.length; i++) {
      images.push({ url: galleryImages[i], alt: `${item.title} — ${i + 1}` });
    }
    return images;
  }, [item, galleryImages]);

  // Related items — same groupSlug (if non-empty), otherwise same type
  const related = useMemo(() => {
    if (item.groupSlug) {
      return allItems.filter(
        (o) => o.id !== item.id && o.groupSlug === item.groupSlug
      );
    }
    if (item.type) {
      return allItems.filter(
        (o) => o.id !== item.id && o.type === item.type
      );
    }
    return [];
  }, [item, allItems]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <main className={styles.detailPage}>
      {/* Return link */}
      <div className={styles.returnLink}>
        <Link href="/others" className={styles.backButton}>
          ← Return to Others
        </Link>
      </div>

      {/* Metadata */}
      <section className={styles.detailMetadata}>
        <div className={styles.detailMetadataContent}>
          <h1 className={styles.detailTitle}>{item.title}</h1>
          {item.type && <p className={styles.detailType}>{item.type}</p>}
          {item.date && (
            <div className={styles.detailMetaFields}>
              <div className={styles.detailMetaField}>
                <span className={styles.detailMetaLabel}>Date</span>
                <span className={styles.detailMetaValue}>
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main image */}
      {item.image && (
        <section className={styles.detailArtworkSection}>
          <div
            className={styles.detailArtworkContainer}
            onClick={() => handleImageClick(0)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleImageClick(0);
            }}
            aria-label="View image fullscreen"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getOthersHeroImageUrl(item.image)}
              alt={item.title}
              className={styles.detailArtworkImage}
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore fetchpriority is valid HTML but not yet in React types
              fetchpriority="high"
              decoding="async"
            />
          </div>
        </section>
      )}

      {/* Description */}
      {item.description && (
        <section className={styles.detailDescriptionSection}>
          <p className={styles.detailDescription}>{item.description}</p>
        </section>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <section className={styles.detailGallerySection}>
          <div className={styles.detailGalleryStrip}>
            {galleryImages.map((url, i) => {
              const offset = item.image ? 1 : 0;
              return (
                <div
                  key={i}
                  className={styles.detailGalleryThumb}
                  onClick={() => handleImageClick(offset + i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleImageClick(offset + i);
                  }}
                  aria-label={`Gallery image ${i + 1} — click to view fullscreen`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getOthersGalleryThumbUrl(url)}
                    alt={`${item.title} — ${i + 1}`}
                    className={styles.detailGalleryThumbImage}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Tags */}
      {item.tags.length > 0 && (
        <section className={styles.detailTagsSection}>
          <div className={styles.detailTags}>
            {item.tags.map((tag, i) => (
              <span key={i} className={styles.detailTag}>{tag}</span>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className={styles.detailRelatedSection}>
          <h2 className={styles.detailRelatedTitle}>
            {item.groupSlug ? "More from this Project" : "More in this Type"}
          </h2>
          <div className={styles.detailRelatedGrid}>
            {related.slice(0, 3).map((rel) => (
              <Link
                key={rel.id}
                href={`/others/${otherSlug(rel)}`}
                className={styles.detailRelatedItem}
              >
                <div className={styles.detailRelatedImageContainer}>
                  {rel.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={getOthersGalleryThumbUrl(rel.image)}
                      alt={rel.title}
                      className={styles.detailRelatedImage}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className={styles.detailRelatedPlaceholder}>
                      No Image
                    </div>
                  )}
                </div>
                <div className={styles.detailRelatedLabel}>
                  <h3 className={styles.detailRelatedItemTitle}>{rel.title}</h3>
                  {rel.type && <p className={styles.detailRelatedItemType}>{rel.type}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom return link */}
      <div className={styles.returnLinkBottom}>
        <Link href="/others" className={styles.backButton}>
          ← Return to Others
        </Link>
      </div>

      {/* Lightbox */}
      {lightboxOpen && allImages[lightboxIndex] && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button
              className={styles.lightboxClose}
              onClick={() => setLightboxOpen(false)}
              aria-label="Close lightbox"
              type="button"
            >
              ✕
            </button>
            <div className={styles.lightboxImageContainer}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getOthersHeroImageUrl(allImages[lightboxIndex].url)}
                alt={allImages[lightboxIndex].alt}
                className={styles.lightboxImage}
              />
            </div>
            {allImages.length > 1 && (
              <>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={() =>
                    setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length)
                  }
                  aria-label="Previous image"
                  type="button"
                >
                  ←
                </button>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={() =>
                    setLightboxIndex((lightboxIndex + 1) % allImages.length)
                  }
                  aria-label="Next image"
                  type="button"
                >
                  →
                </button>
                <div className={styles.lightboxCounter}>
                  {lightboxIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
