import { PaletteFilter } from "./PaletteFilter";
import styles from "./archive.module.css";
import { ArchiveFilterKey, ArchiveFilterOptions, ArchiveSelection, FilterOption } from "./types";

interface ArchiveFiltersProps {
  options: ArchiveFilterOptions;
  selected: ArchiveSelection;
  onToggle: (key: ArchiveFilterKey, value: string) => void;
}

function CheckFilter({
  title,
  filterKey,
  options,
  selected,
  onToggle,
}: {
  title: string;
  filterKey: Exclude<ArchiveFilterKey, "palette">;
  options: FilterOption[];
  selected: string[];
  onToggle: ArchiveFiltersProps["onToggle"];
}) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterLegend}>{title}</legend>
      {options.length === 0 ? (
        <p className={styles.filterEmpty}>None available</p>
      ) : (
        <div className={styles.checkList}>
          {options.map((option) => (
            <label className={styles.checkOption} key={option.value}>
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => onToggle(filterKey, option.value)}
              />
              <span className={styles.checkBox} aria-hidden="true" />
              <span className={styles.checkText}>{option.label}</span>
              <span className={styles.filterCount}>{option.count}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

export function ArchiveFilters({ options, selected, onToggle }: ArchiveFiltersProps) {
  return (
    <div className={styles.filters}>
      <CheckFilter title="Artist" filterKey="artists" options={options.artists} selected={selected.artists} onToggle={onToggle} />
      <CheckFilter title="Category" filterKey="categories" options={options.categories} selected={selected.categories} onToggle={onToggle} />
      <CheckFilter title="Style" filterKey="style" options={options.style} selected={selected.style} onToggle={onToggle} />
      <CheckFilter title="Year" filterKey="years" options={options.years} selected={selected.years} onToggle={onToggle} />
      <PaletteFilter options={options.palette} selected={selected.palette} onToggle={(value) => onToggle("palette", value)} />
    </div>
  );
}
