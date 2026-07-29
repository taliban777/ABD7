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
        <div className={styles.paletteGroupList}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            const groupColors = option._groupColors || [];
            const label = option.label || option.value;

            return (
              <button
                className={`${styles.swatchGroup} ${isSelected ? styles.swatchGroupSelected : ""}`}
                key={option.value}
                type="button"
                title={`${label} · ${option.count} projects`}
                aria-label={`${isSelected ? "Remove" : "Filter by"} ${label}, ${option.count} projects`}
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
              >
                <div className={styles.swatchGroupColors}>
                  {groupColors.slice(0, 3).map((color: string, idx: number) => (
                    <span
                      key={`${option.value}-${idx}`}
                      style={{ backgroundColor: color }}
                      className={styles.swatchGroupColor}
                    />
                  ))}
                </div>
                <span className={styles.swatchGroupLabel}>{label}</span>
                <em className={styles.swatchGroupCount}>{option.count}</em>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
