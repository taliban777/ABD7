import styles from "./archive.module.css";

interface ArchiveSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ArchiveSearch({ value, onChange }: ArchiveSearchProps) {
  return (
    <div className={styles.searchWrapper}>
      {/* Search icon */}
      <svg
        className={styles.searchIcon}
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
        <line x1="10" y1="10" x2="14" y2="14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      <label className={styles.searchLabel}>
        <span className={styles.srOnly}>Search archive</span>
        <input
          className={styles.searchInput}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search archive…"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      {/* Clear button — only visible when there is a value */}
      {value.length > 0 && (
        <button
          className={styles.searchClear}
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          ×
        </button>
      )}
    </div>
  );
}
