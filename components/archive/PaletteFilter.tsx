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
        <div className={styles.paletteRow}>
          {options.map((option) => {
            const isSelected = selected.includes(option.value);
            const color = option.color || "#888888";
            const label = option.label || option.value;

            return (
              <button
                className={`${styles.paletteChip} ${isSelected ? styles.paletteChipSelected : ""}`}
                key={option.value}
                type="button"
                title={`${label} · ${option.count} projects`}
                aria-label={`${isSelected ? "Remove" : "Filter by"} ${label}, ${option.count} projects`}
                aria-pressed={isSelected}
                onClick={() => onToggle(option.value)}
                style={{ "--chip-color": color } as React.CSSProperties}
              >
                <span className={styles.paletteChipColor} />
                <span className={styles.paletteChipLabel}>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
