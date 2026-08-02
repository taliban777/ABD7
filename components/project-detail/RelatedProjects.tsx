'use client';

import Link from 'next/link';
import type { CmsProject } from '@/components/archive/types';
import { asArray, valueLabel, projectSlug, catalogueNumber } from '@/components/archive/types';
import { getArchiveImageUrl } from '@/components/images/cloudinary';
import styles from './project-detail.module.css';

export interface RelatedProjectsProps {
  byArtist: CmsProject[];
  byStyle: CmsProject[];
  allProjects: CmsProject[];
}

export function RelatedProjects({
  byArtist,
  byStyle,
  allProjects,
}: RelatedProjectsProps) {
  // Calculate stable catalogue numbers
  const chronological = [...allProjects].sort((a, b) => {
    const aYear = a.year ?? 0;
    const bYear = b.year ?? 0;
    if (aYear !== bYear) return aYear - bYear;
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });

  const getCatalogueNum = (projectId: string) => {
    const index = chronological.findIndex((p) => p.id === projectId);
    return catalogueNumber(index >= 0 ? index : 0);
  };

  const RelatedItem = ({ project }: { project: CmsProject }) => {
    const catalogueNum = getCatalogueNum(project.id);
    const artistNames = asArray(project.artists)
      .map(valueLabel)
      .filter(Boolean)
      .join(', ');

    return (
      <Link
        href={`/projects/${projectSlug(project)}`}
        className={styles.relatedItem}
      >
        <div className={styles.relatedImageContainer}>
          {project.frontCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={getArchiveImageUrl(project.frontCover)}
              alt={project.title}
              className={styles.relatedImage}
            />
          ) : (
            <div className={styles.relatedImagePlaceholder} aria-hidden="true">
              No Image
            </div>
          )}
        </div>
        <div className={styles.relatedLabel}>
          <div className={styles.relatedMeta}>
            <span className={styles.relatedCatalogue}>No. {catalogueNum}</span>
            {project.year && <span className={styles.relatedYear}>{project.year}</span>}
          </div>
          <h3 className={styles.relatedTitle}>{project.title}</h3>
          {artistNames && (
            <p className={styles.relatedArtist}>{artistNames}</p>
          )}
        </div>
      </Link>
    );
  };

  const hasArtist = byArtist.length > 0;
  const hasStyle = byStyle.length > 0;
  const hasAny = hasArtist || hasStyle;

  if (!hasAny) return null;

  return (
    <div className={styles.relatedContainer}>
      <h2 className={styles.relatedSectionTitle}>Related Projects</h2>

      {hasArtist && (
        <div className={styles.relatedGroup}>
          <h3 className={styles.relatedGroupTitle}>More from this Artist</h3>
          <div className={styles.relatedGrid}>
            {byArtist.map((project) => (
              <RelatedItem key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}

      {hasStyle && (
        <div className={styles.relatedGroup}>
          <h3 className={styles.relatedGroupTitle}>Similar Style</h3>
          <div className={styles.relatedGrid}>
            {byStyle.map((project) => (
              <RelatedItem key={project.id} project={project} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
