import { ArchiveFilters } from "./ArchiveFilters";
import { ArchiveSearch } from "./ArchiveSearch";
import styles from "./archive.module.css";
import { ArchiveFilterKey, ArchiveSelection, CmsListValue } from "./types";

interface ArchiveToolbarProps {
  isOpen: boolean;
  search: string;
  selected: ArchiveSelection;
  options: { artists: CmsListValue[]; categories: CmsListValue[]; style: CmsListValue[]; years: string[]; palette: CmsListValue[] };
  activeCount: number;
  onOpenChange: () => void;
  onSearchChange: (value: string) => void;
  onToggle: (key: ArchiveFilterKey, value: string) => void;
  onClear: () => void;
}

export function ArchiveToolbar(props: ArchiveToolbarProps) {
  return (
    <section className={`${styles.toolbar} ${props.isOpen ? styles.toolbarOpen : ""}`} aria-label="Archive controls">
      <div className={styles.toolbarTop}>
        <ArchiveSearch value={props.search} onChange={props.onSearchChange} />
        <button className={styles.filterToggle} type="button" onClick={props.onOpenChange} aria-expanded={props.isOpen} aria-controls="archive-filter-panel">
          Filter {props.isOpen ? "−" : "+"}
        </button>
      </div>
      <div className={styles.filterPanel} id="archive-filter-panel" aria-hidden={!props.isOpen}>
        <ArchiveFilters options={props.options} selected={props.selected} onToggle={props.onToggle} />
        <div className={styles.filterFooter}>
          <button type="button" onClick={props.onClear} disabled={props.activeCount === 0}>Clear Filters</button>
          <span>{props.activeCount} {props.activeCount === 1 ? "Filter" : "Filters"} Selected</span>
        </div>
      </div>
    </section>
  );
}
