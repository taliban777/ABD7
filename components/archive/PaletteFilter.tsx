import styles from "./archive.module.css";
import { FilterOption } from "./types";

interface PaletteFilterProps {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export function PaletteFilter({ options, selected, onToggle }: PaletteFilterProps) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterLegend}>Palette</legend>
      {options.length === 0 ? (
        <p className={styles.filterEmpty}>None available</p>
      ) : (
        <div className={styles.paletteList}>
          {options.map((option) => {
            const color = option.color || option.value;
            const isSelected = selected.includes(option.value);
            const label = option.label || color;
            return (
              <button
                className={`${styles.swatch} ${isSelected ? styles.swatchSelected : ""}`}
                key={option.value}
                type="button"
                title={`${label} · ${option.count}`}
                aria-label={`${isSelected ? "Remove" : "Filter by"} ${label}, ${option.count} projects`}
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
              >
                <span style={{ backgroundColor: color }} />
                <em className={styles.swatchCount}>{option.count}</em>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
