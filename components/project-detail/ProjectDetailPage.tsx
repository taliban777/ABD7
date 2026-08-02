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
  const chronological = allProjects.sort((a, b) => {
    const aYear = a.year ?? 0;
    const bYear = b.year ?? 0;
    if (aYear !== bYear) return aYear - bYear;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });
  const projectIndex = chronological.findIndex((p) => p.id === project.id);
  const catalogueNum = catalogueNumber(projectIndex >= 0 ? projectIndex : 0);

  // Collect all images for lightbox: front cover, back cover, then gallery
  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    if (project.frontCover) {
      images.push({ url: project.frontCover, alt: `${project.title} - Front` });
    }
    // Note: backCover would be added here if available in CMS
    // if (project.backCover) {
    //   images.push({ url: project.backCover, alt: `${project.title} - Back` });
    // }
    return images;
  }, [project]);

  // Determine artwork display mode
  const hasFrontCover = !!project.frontCover;
  const hasBackCover = false; // TODO: add when backCover field is available in CMS

  // Palette colors
  const paletteColors = useMemo(
    () => asArray(project.palette).map(paletteValue).filter(Boolean),
    [project.palette]
  );

  // Related projects
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

  const relatedByPalette = useMemo(() => {
    const paletteSet = new Set(asArray(project.palette).map(valueLabel));
    return allProjects.filter(
      (p) =>
        p.id !== project.id &&
        asArray(p.palette).some((pal) => paletteSet.has(valueLabel(pal)))
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

            {asArray(project.categories).length > 0 && (
              <div className={styles.metadataField}>
                <span className={styles.label}>Categories</span>
                <span className={styles.value}>
                  {asArray(project.categories)
                    .map(valueLabel)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}

            {asArray(project.style).length > 0 && (
              <div className={styles.metadataField}>
                <span className={styles.label}>Styles</span>
                <span className={styles.value}>
                  {asArray(project.style)
                    .map(valueLabel)
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Artwork Display Section */}
      {hasFrontCover && (
        <section className={styles.artworkSection}>
          {!hasBackCover ? (
            // Single artwork centered
            <div
              className={styles.artworkSingleContainer}
              onClick={() => handleImageClick(0)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleImageClick(0);
                }
              }}
              aria-label="Click to view artwork in fullscreen"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getProjectImageUrl(project.frontCover)}
                alt={project.title}
                className={styles.artworkImage}
              />
            </div>
          ) : (
            // Side-by-side artwork (front and back)
            <div className={styles.artworkDualContainer}>
              <div
                className={styles.artworkSide}
                onClick={() => handleImageClick(0)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleImageClick(0);
                  }
                }}
                aria-label="Front cover - click to view in fullscreen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getProjectImageUrl(project.frontCover)}
                  alt={`${project.title} - Front`}
                  className={styles.artworkImage}
                />
              </div>
              {/* Back cover would be rendered here when available */}
            </div>
          )}
        </section>
      )}

      {/* Palette Section */}
      {paletteColors.length > 0 && (
        <section className={styles.paletteSection}>
          <PaletteVisualization colors={paletteColors} title={project.title} />
        </section>
      )}

      {/* Gallery Section - Note: Gallery images would need to be added to CMS schema */}
      {/* Gallery images would go here if available in the CMS project model */}

      {/* Related Projects Section */}
      <section className={styles.relatedSection}>
        <RelatedProjects
          byArtist={relatedByArtist.slice(0, 3)}
          byStyle={relatedByStyle.slice(0, 3)}
          byPalette={relatedByPalette.slice(0, 3)}
          currentProjectId={project.id}
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
