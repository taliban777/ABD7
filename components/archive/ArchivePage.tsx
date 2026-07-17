import { useMemo, useState } from "react";
import { ArchiveGrid } from "./ArchiveGrid";
import { ArchiveToolbar } from "./ArchiveToolbar";
import styles from "./archive.module.css";
import { ArchiveFilterKey, ArchiveSelection, CmsListValue, CmsProject, paletteValue, valueLabel } from "./types";

const emptySelection: ArchiveSelection = { artists: [], categories: [], style: [], years: [], palette: [] };
const unique = (items: CmsListValue[]) => Array.from(new Map(items.map((item) => [valueLabel(item), item])).values()).filter(valueLabel);

export interface ArchivePageProps { projects: CmsProject[] }

export function ArchivePage({ projects }: ArchivePageProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArchiveSelection>(emptySelection);

  const options = useMemo(() => ({
    artists: unique(projects.flatMap((project) => project.artists)),
    categories: unique(projects.flatMap((project) => project.categories)),
    style: unique(projects.flatMap((project) => project.style)),
    years: Array.from(new Set(projects.map((project) => project.year).filter(Boolean).map(String))).sort((a, b) => Number(b) - Number(a)),
    palette: Array.from(new Map(projects.flatMap((project) => project.palette).map((item) => [paletteValue(item), item])).values()).filter((item) => paletteValue(item)),
  }), [projects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const includesAny = (values: CmsListValue[], chosen: string[]) => chosen.length === 0 || values.some((value) => chosen.includes(valueLabel(value)));
    return projects
      .filter((project) => {
        const searchable = [project.title, project.year, ...project.artists.map(valueLabel), ...project.categories.map(valueLabel), ...project.style.map(valueLabel)].join(" ").toLocaleLowerCase();
        return (!query || searchable.includes(query))
          && includesAny(project.artists, selected.artists)
          && includesAny(project.categories, selected.categories)
          && includesAny(project.style, selected.style)
          && (selected.years.length === 0 || selected.years.includes(String(project.year)))
          && (selected.palette.length === 0 || project.palette.some((value) => selected.palette.includes(paletteValue(value))));
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [projects, search, selected]);

  const activeCount = Object.values(selected).reduce((count, values) => count + values.length, 0);
  const toggle = (key: ArchiveFilterKey, value: string) => setSelected((current) => ({ ...current, [key]: current[key].includes(value) ? current[key].filter((item) => item !== value) : [...current[key], value] }));

  return (
    <main className={styles.archivePage}>
      <header className={styles.siteHeader}>
        <a href="/" className={styles.wordmark}>ARTBYDANI7</a>
        <span>Archive Control Centre</span>
      </header>
      <div className={styles.intro}>
        <p>Independent art direction and visual archive</p>
        <h1>Archive</h1>
      </div>
      <ArchiveToolbar isOpen={isOpen} search={search} selected={selected} options={options} activeCount={activeCount} onOpenChange={() => setIsOpen((value) => !value)} onSearchChange={setSearch} onToggle={toggle} onClear={() => setSelected(emptySelection)} />
      <div className={styles.index}>
        <strong>{filtered.length} {filtered.length === 1 ? "Project" : "Projects"}</strong>
        <span>Sorted: <b>Newest</b></span>
        <span>Showing: <b>{activeCount || search ? "Filtered" : "All"}</b></span>
      </div>
      <ArchiveGrid projects={filtered} />
      {filtered.length === 0 ? <p className={styles.empty}>No projects match this archive query.</p> : null}
    </main>
  );
}
