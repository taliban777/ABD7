'use client';

import styles from './project-detail.module.css';

export interface PaletteVisualizationProps {
  colors: string[];
  /** When true the palette bar animates in via scaleX (controlled by useInView in parent). */
  barVisible?: boolean;
}

/**
 * Renders the colour palette as a proportional horizontal bar — each swatch
 * takes an equal slice. Below the bar, hex codes are listed in a row.
 * Replaces the old grid of large squares with an editorial colour-band approach.
 */
export function PaletteVisualization({ colors, barVisible = false }: PaletteVisualizationProps) {
  if (colors.length === 0) return null;

  return (
    <div className={styles.paletteContainer}>
      <h2 className={styles.paletteTitle}>Colour Palette</h2>

      {/* Proportional bar — equal slices; scaleX animates in on scroll */}
      <div
        className={`${styles.paletteBar} ${barVisible ? styles.paletteBarVisible : ''}`}
        aria-hidden="true"
      >
        {colors.map((color, i) => (
          <div
            key={i}
            className={styles.paletteBarSlice}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Hex codes below */}
      <ol className={styles.paletteCodeRow} aria-label="Palette colours">
        {colors.map((color, i) => (
          <li key={i} className={styles.paletteCodeItem}>
            <span
              className={styles.paletteCodeDot}
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className={styles.paletteCode}>{color}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
