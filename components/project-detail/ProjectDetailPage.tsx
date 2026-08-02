'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CmsProject } from '@/components/archive/types';
import { asArray, valueLabel, paletteValue, catalogueNumber } from '@/components/archive/types';
import { getProjectImageUrl } from '@/components/images/cloudinary';
import styles from './project-detail.module.css';
import { Lightbox } from './Lightbox';
import { PaletteVisualization } from './PaletteVisualization';
import { RelatedProjects } from './RelatedProjects';

export interface ProjectDetailPageProps {
  project: CmsProject;
  allProjects: CmsProject[];
}

export function ProjectDetailPage({ project, allProjects }: ProjectDetailPageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Extract metadata
  const artistNames = asArray(project.artists)
    .map(valueLabel)
    .filter(Boolean)
    .join(', ');

  // Calculate stable catalogue number
  const chronological = [...allProjects].sort((a, b) => {
    const aYear = a.year ?? 0;
    const bYear = b.year ?? 0;
    if (aYear !== bYear) return aYear - bYear;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
  const projectIndex = chronological.findIndex((p) => p.id === project.id);
  const catalogueNum = catalogueNumber(projectIndex >= 0 ? projectIndex : 0);

  // Determine which images are available
  const hasFrontCover = !!project.frontCover;
  const hasBackCover = !!project.backCover;
  const galleryImages = project.gallery ?? [] as string[];
  const hasGallery = galleryImages.length > 0;

  // Collect all images for lightbox: front cover, back cover, then gallery
  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    if (project.frontCover) {
      images.push({ url: project.frontCover, alt: `${project.title} — Front` });
    }
    if (project.backCover) {
      images.push({ url: project.backCover, alt: `${project.title} — Back` });
    }
    for (let i = 0; i < galleryImages.length; i++) {
      images.push({ url: galleryImages[i], alt: `${project.title} — ${i + 1}` });
    }
    return images;
  }, [project, galleryImages]);

  // Palette colors
  const paletteColors = useMemo(
    () => asArray(project.palette).map(paletteValue).filter(Boolean),
    [project.palette]
  );

  // Related projects — by artist and style only
  const relatedByArtist = useMemo(() => {
    const artistSet = new Set(asArray(project.artists).map(valueLabel));
    return allProjects.filter(
      (p) =>
        p.id !== project.id &&
        asArray(p.artists).some((a) => artistSet.has(valueLabel(a)))
    );
  }, [project, allProjects]);

  const relatedByStyle = useMemo(() => {
    const styleSet = new Set(asArray(project.style).map(valueLabel));
    return allProjects.filter(
      (p) =>
        p.id !== project.id &&
        asArray(p.style).some((s) => styleSet.has(valueLabel(s)))
    );
  }, [project, allProjects]);

  const handleImageClick = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <main className={styles.detailPage}>
      {/* Return to Archive Link */}
      <div className={styles.returnLink}>
        <Link href="/collection" className={styles.backButton}>
          ← Return to Archive
        </Link>
      </div>

      {/* Metadata Section */}
      <section className={styles.metadata}>
        <div className={styles.metadataContent}>
          <h1 className={styles.title}>{project.title}</h1>

          {artistNames && (
            <p className={styles.artist}>{artistNames}</p>
          )}

          <div className={styles.metadataFields}>
            {project.year && (
              <div className={styles.metadataField}>
                <span className={styles.label}>Year</span>
                <span className={styles.value}>{project.year}</span>
              </div>
            )}

            <div className={styles.metadataField}>
              <span className={styles.label}>Catalogue No.</span>
              <span className={styles.value}>{catalogueNum}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Artwork Display Section */}
      {hasFrontCover && (
        <section className={styles.artworkSection}>
          {hasBackCover ? (
            // Side-by-side: front and back cover
            <div className={styles.artworkDualContainer}>
              <div
                className={styles.artworkSide}
                onClick={() => handleImageClick(0)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleImageClick(0);
                }}
                aria-label="Front cover — click to view fullscreen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProjectImageUrl(project.frontCover)}
                  alt={`${project.title} — Front`}
                  className={styles.artworkImage}
                />
              </div>
              <div
                className={styles.artworkSide}
                onClick={() => handleImageClick(1)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') handleImageClick(1);
                }}
                aria-label="Back cover — click to view fullscreen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProjectImageUrl(project.backCover!)}
                  alt={`${project.title} — Back`}
                  className={styles.artworkImage}
                />
              </div>
            </div>
          ) : (
            // Single artwork centered
            <div
              className={styles.artworkSingleContainer}
              onClick={() => handleImageClick(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleImageClick(0);
              }}
              aria-label="Click to view artwork fullscreen"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProjectImageUrl(project.frontCover)}
                alt={project.title}
                className={styles.artworkImage}
              />
            </div>
          )}
        </section>
      )}

      {/* Gallery Strip — shown when additional images exist */}
      {hasGallery && (
        <section className={styles.gallerySection}>
          <div className={styles.galleryStrip}>
            {galleryImages.map((url, i) => {
              // Offset index: front cover is 0, back cover is 1 if present
              const lightboxOffset = 1 + (hasBackCover ? 1 : 0);
              return (
                <div
                  key={i}
                  className={styles.galleryThumb}
                  onClick={() => handleImageClick(lightboxOffset + i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleImageClick(lightboxOffset + i);
                  }}
                  aria-label={`Gallery image ${i + 1} — click to view fullscreen`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProjectImageUrl(url)}
                    alt={`${project.title} — ${i + 1}`}
                    className={styles.galleryThumbImage}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Palette Section */}
      {paletteColors.length > 0 && (
        <section className={styles.paletteSection}>
          <PaletteVisualization colors={paletteColors} />
        </section>
      )}

      {/* Related Projects Section */}
      <section className={styles.relatedSection}>
        <RelatedProjects
          byArtist={relatedByArtist.slice(0, 3)}
          byStyle={relatedByStyle.slice(0, 3)}
          allProjects={allProjects}
        />
      </section>

      {/* Return to Archive Link (Bottom) */}
      <div className={styles.returnLinkBottom}>
        <Link href="/collection" className={styles.backButton}>
          ← Return to Archive
        </Link>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <Lightbox
          images={allImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setLightboxIndex}
        />
      )}
    </main>
  );
}
