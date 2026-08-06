'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CmsProject } from '@/components/archive/types';
import { asArray, valueLabel, paletteValue, catalogueNumber, projectSlug } from '@/components/archive/types';
import { getProjectImageUrl, getGalleryThumbUrl } from '@/components/images/cloudinary';
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

  const categoryNames = asArray(project.categories)
    .map(valueLabel)
    .filter(Boolean);

  const styleNames = asArray(project.style)
    .map(valueLabel)
    .filter(Boolean);

  // Stable catalogue numbers — chronological
  const chronological = useMemo(
    () =>
      [...allProjects].sort((a, b) => {
        const aYear = a.year ?? 0;
        const bYear = b.year ?? 0;
        if (aYear !== bYear) return aYear - bYear;
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }),
    [allProjects]
  );

  const projectIndex = chronological.findIndex((p) => p.id === project.id);
  const catalogueNum = catalogueNumber(projectIndex >= 0 ? projectIndex : 0);

  // Sibling navigation — prev/next in chronological order
  const prevProject = projectIndex > 0 ? chronological[projectIndex - 1] : null;
  const nextProject = projectIndex < chronological.length - 1 ? chronological[projectIndex + 1] : null;

  // Available images
  const hasFrontCover = !!project.frontCover;
  const hasBackCover = !!project.backCover;
  const galleryImages = useMemo(() => project.gallery ?? ([] as string[]), [project.gallery]);
  const hasGallery = galleryImages.length > 0;

  // All images for lightbox: front → back → gallery
  const allImages = useMemo(() => {
    const images: Array<{ url: string; alt: string }> = [];
    if (project.frontCover) {
      images.push({ url: project.frontCover, alt: `${project.title} — Front` });
    }
    if (project.backCover) {
      images.push({ url: project.backCover, alt: `${project.title} — Back` });
    }
    galleryImages.forEach((url, i) => {
      images.push({ url, alt: `${project.title} — Image ${i + 1}` });
    });
    return images;
  }, [project, galleryImages]);

  // Palette colours
  const paletteColors = useMemo(
    () => asArray(project.palette).map(paletteValue).filter(Boolean),
    [project.palette]
  );

  // Related projects — by artist and style
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

  const lightboxOffset = 1 + (hasBackCover ? 1 : 0);

  return (
    <main className={styles.detailPage}>

      {/* ── Breadcrumb + sibling navigation ── */}
      <nav className={styles.breadcrumbBar} aria-label="Archive navigation">
        <Link href="/collection" className={styles.breadcrumbBack}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Archive
        </Link>

        <div className={styles.breadcrumbSiblings}>
          {prevProject ? (
            <Link
              href={`/projects/${projectSlug(prevProject)}`}
              className={styles.siblingLink}
              aria-label={`Previous work: ${prevProject.title}`}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M8 1L3 6l5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className={styles.siblingLabel}>{prevProject.title}</span>
            </Link>
          ) : <span />}

          <span className={styles.breadcrumbCatalogue}>No. {catalogueNum}</span>

          {nextProject ? (
            <Link
              href={`/projects/${projectSlug(nextProject)}`}
              className={styles.siblingLink}
              aria-label={`Next work: ${nextProject.title}`}
            >
              <span className={styles.siblingLabel}>{nextProject.title}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M4 1l5 5-5 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ) : <span />}
        </div>
      </nav>

      {/* ── Metadata + primary artwork ── */}
      <div className={styles.heroLayout}>

        {/* Left: metadata column */}
        <aside className={styles.metadataColumn}>
          <div className={styles.metadataSticky}>

            {categoryNames.length > 0 && (
              <div className={styles.metaTagRow}>
                {categoryNames.map((cat) => (
                  <span key={cat} className={styles.metaTag}>{cat}</span>
                ))}
              </div>
            )}

            <h1 className={styles.title}>{project.title}</h1>

            {artistNames && (
              <p className={styles.artist}>{artistNames}</p>
            )}

            <dl className={styles.metadataList}>
              {project.year && (
                <div className={styles.metadataPair}>
                  <dt>Year</dt>
                  <dd>{project.year}</dd>
                </div>
              )}
              <div className={styles.metadataPair}>
                <dt>Catalogue</dt>
                <dd>No. {catalogueNum}</dd>
              </div>
              {styleNames.length > 0 && (
                <div className={styles.metadataPair}>
                  <dt>Style</dt>
                  <dd>{styleNames.join(', ')}</dd>
                </div>
              )}
            </dl>

            {/* Palette strip in sidebar on wide screens */}
            {paletteColors.length > 0 && (
              <div className={styles.metadataPaletteStrip} aria-hidden="true">
                {paletteColors.map((color, i) => (
                  <span
                    key={i}
                    className={styles.metadataPaletteSlice}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: primary artwork */}
        <div className={styles.artworkColumn}>
          {hasFrontCover && (
            <section className={styles.artworkSection} aria-label="Primary artwork">
              {hasBackCover ? (
                <div className={styles.artworkDualContainer}>
                  <button
                    className={styles.artworkSide}
                    onClick={() => handleImageClick(0)}
                    aria-label="Front cover — click to view fullscreen"
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProjectImageUrl(project.frontCover)}
                      alt={`${project.title} — Front`}
                      className={styles.artworkImage}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-ignore
                      fetchpriority="high"
                      decoding="async"
                    />
                  </button>
                  <button
                    className={styles.artworkSide}
                    onClick={() => handleImageClick(1)}
                    aria-label="Back cover — click to view fullscreen"
                    type="button"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getProjectImageUrl(project.backCover!)}
                      alt={`${project.title} — Back`}
                      className={styles.artworkImage}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>
                </div>
              ) : (
                <button
                  className={styles.artworkSingleContainer}
                  onClick={() => handleImageClick(0)}
                  aria-label="Click to view artwork fullscreen"
                  type="button"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getProjectImageUrl(project.frontCover)}
                    alt={project.title}
                    className={styles.artworkImage}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    fetchpriority="high"
                    decoding="async"
                  />
                </button>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── Gallery filmstrip ── */}
      {hasGallery && (
        <section className={styles.gallerySection} aria-label="Additional images">
          <p className={styles.gallerySectionLabel}>Gallery</p>
          <div className={styles.galleryStrip}>
            {galleryImages.map((url, i) => (
              <button
                key={i}
                className={styles.galleryThumb}
                onClick={() => handleImageClick(lightboxOffset + i)}
                aria-label={`Gallery image ${i + 1} — click to view fullscreen`}
                type="button"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getGalleryThumbUrl(url)}
                  alt={`${project.title} — ${i + 1}`}
                  className={styles.galleryThumbImage}
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ── Palette section ── */}
      {paletteColors.length > 0 && (
        <section className={styles.paletteSection}>
          <PaletteVisualization colors={paletteColors} />
        </section>
      )}

      {/* ── Related projects ── */}
      <section className={styles.relatedSection}>
        <RelatedProjects
          byArtist={relatedByArtist.slice(0, 3)}
          byStyle={relatedByStyle.slice(0, 3)}
          allProjects={allProjects}
        />
      </section>

      {/* ── Return link (bottom) ── */}
      <div className={styles.returnLinkBottom}>
        <Link href="/collection" className={styles.backButton}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Return to Archive
        </Link>
      </div>

      {/* ── Lightbox ── */}
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
