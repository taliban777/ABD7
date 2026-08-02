'use client';

import styles from './project-detail.module.css';

export interface PaletteVisualizationProps {
  colors: string[];
  title?: string;
}

/**
 * Creates a minimal, editorial palette visualization.
 * Renders a geometric arrangement of color specimens that feels
 * like a museum archive piece rather than a simple color swatch.
 */
export function PaletteVisualization({ colors }: PaletteVisualizationProps) {
  if (colors.length === 0) return null;

  // Create a geometric layout based on the number of colors
  // This creates visual interest while maintaining editorial restraint
  const getLayout = (count: number) => {
    if (count === 1) return 'layout-1';
    if (count === 2) return 'layout-2';
    if (count === 3) return 'layout-3';
    if (count === 4) return 'layout-4';
    if (count === 5) return 'layout-5';
    return 'layout-many';
  };

  const layout = getLayout(colors.length);

  return (
    <div className={styles.paletteContainer}>
      <h2 className={styles.paletteTitle}>Palette</h2>
      <div className={`${styles.paletteGrid} ${styles[layout]}`}>
        {colors.map((color, index) => (
          <div key={index} className={styles.paletteSpecimen}>
            <div
              className={styles.paletteColor}
              style={{ backgroundColor: color }}
              title={color}
              aria-label={`Color ${index + 1}: ${color}`}
            />
            <span className={styles.paletteCode}>{color}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
