import { PaletteFilter } from "./PaletteFilter";
import styles from "./archive.module.css";
import { ArchiveFilterKey, ArchiveSelection, CmsListValue, valueLabel } from "./types";

interface ArchiveFiltersProps {
  options: {
    artists: CmsListValue[];
    categories: CmsListValue[];
    style: CmsListValue[];
    years: string[];
    palette: CmsListValue[];
  };
  selected: ArchiveSelection;
  onToggle: (key: ArchiveFilterKey, value: string) => void;
}

function CheckFilter({ title, filterKey, options, selected, onToggle }: {
  title: string;
  filterKey: Exclude<ArchiveFilterKey, "palette">;
  options: Array<CmsListValue | string>;
  selected: string[];
  onToggle: ArchiveFiltersProps["onToggle"];
}) {
  return (
    <fieldset className={styles.filterGroup}>
      <legend className={styles.filterLegend}>{title}</legend>
      <div className={styles.checkList}>
        {options.map((option) => {
          const label = typeof option === "string" ? option : valueLabel(option);
          return (
            <label className={styles.checkOption} key={label}>
              <input type="checkbox" checked={selected.includes(label)} onChange={() => onToggle(filterKey, label)} />
              <span aria-hidden="true" />
              {label}
            </label>
          );
        })}
      </div>
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
