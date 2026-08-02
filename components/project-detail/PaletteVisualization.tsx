'use client';

import styles from './project-detail.module.css';

export interface PaletteVisualizationProps {
  colors: string[];
}

export function PaletteVisualization({ colors }: PaletteVisualizationProps) {
  if (colors.length === 0) return null;

  return (
    <div className={styles.paletteContainer}>
      <h2 className={styles.paletteTitle}>Palette</h2>
      <div className={styles.paletteRow}>
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
