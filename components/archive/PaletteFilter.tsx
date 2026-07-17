import styles from "./archive.module.css";
import { CmsListValue, paletteValue, valueLabel } from "./types";

interface PaletteFilterProps {
  options: CmsListValue[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function PaletteFilter({ options, selected, onToggle }: PaletteFilterProps) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterLegend}>Palette</legend>
      <div className={styles.paletteList}>
        {options.map((option) => {
          const color = paletteValue(option);
          const label = valueLabel(option) || color;
          const isSelected = selected.includes(color);
          return (
            <button
              className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ""}`}
              key={`${label}-${color}`}
              type="button"
              title={label}
              aria-label={`${isSelected ? "Remove" : "Filter by"} ${label}`}
              aria-pressed={isSelected}
              onClick={() => onToggle(color)}
            >
              <span style={{ backgroundColor: color }} />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
