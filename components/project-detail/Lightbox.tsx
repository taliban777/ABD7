'use client';

import { useEffect } from 'react';
import { getProjectImageUrl } from '@/components/images/cloudinary';
import styles from './project-detail.module.css';

export interface LightboxProps {
  images: Array<{ url: string; alt: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % images.length);
      } else if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + images.length) % images.length);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose, onNavigate]);

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div className={styles.lightboxOverlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close lightbox"
          type="button"
        >
          ✕
        </button>

        <div className={styles.lightboxImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProjectImageUrl(currentImage.url)}
            alt={currentImage.alt}
            className={styles.lightboxImage}
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
              type="button"
            >
              ←
            </button>
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={() => onNavigate((currentIndex + 1) % images.length)}
              aria-label="Next image"
              type="button"
            >
              →
            </button>
            <div className={styles.lightboxCounter}>
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
