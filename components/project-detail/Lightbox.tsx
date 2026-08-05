'use client';

import { useEffect, useRef } from 'react';
import { getProjectImageUrl } from '@/components/images/cloudinary';
import styles from './project-detail.module.css';

export interface LightboxProps {
  images: Array<{ url: string; alt: string }>;
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export function Lightbox({ images, currentIndex, onClose, onNavigate }: LightboxProps) {
  // Touch tracking for swipe gestures
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // ── Body scroll lock ──────────────────────────────────────────────────────
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // ── Keyboard navigation ───────────────────────────────────────────────────
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

  // ── Touch / swipe gestures ────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY.current);

    // Only recognise horizontal swipes (avoid triggering on vertical scroll)
    if (Math.abs(deltaX) > 50 && deltaY < 60) {
      if (deltaX < 0) {
        // Swipe left → next
        onNavigate((currentIndex + 1) % images.length);
      } else {
        // Swipe right → prev
        onNavigate((currentIndex - 1 + images.length) % images.length);
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  const currentImage = images[currentIndex];
  if (!currentImage) return null;

  return (
    <div
      className={styles.lightboxOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Lightbox: ${currentImage.alt}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Stop propagation so clicks inside don't close the lightbox */}
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>

        {/* Close — 52×52 touch target */}
        <button
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close lightbox"
          type="button"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>

        {/* Image */}
        <div className={styles.lightboxImageContainer}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProjectImageUrl(currentImage.url)}
            alt={currentImage.alt}
            className={styles.lightboxImage}
            draggable={false}
          />
        </div>

        {/* Caption */}
        <p className={styles.lightboxCaption} aria-live="polite">
          {currentImage.alt}
        </p>

        {/* Prev / Next navigation */}
        {images.length > 1 && (
          <>
            <button
              className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
              onClick={() => onNavigate((currentIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M10 2L5 8l5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              className={`${styles.lightboxNav} ${styles.lightboxNext}`}
              onClick={() => onNavigate((currentIndex + 1) % images.length)}
              aria-label="Next image"
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M6 2l5 6-5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className={styles.lightboxCounter} aria-live="polite">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
