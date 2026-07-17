import styles from "./archive.module.css";

interface ArchiveSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function ArchiveSearch({ value, onChange }: ArchiveSearchProps) {
  return (
    <label className={styles.searchLabel}>
      <span className={styles.srOnly}>Search archive</span>
      <input
        className={styles.searchInput}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search archive..."
        autoComplete="off"
      />
    </label>
  );
}
