import { useMemo, useState } from "react";
import { ArchiveGrid } from "./ArchiveGrid";
import { ArchiveToolbar } from "./ArchiveToolbar";
import styles from "./archive.module.css";
import { ArchiveFilterKey, ArchiveSelection, CmsListValue, CmsProject, paletteValue, valueLabel } from "./types";

const emptySelection: ArchiveSelection = { artists: [], categories: [], style: [], years: [], palette: [] };
const unique = (items: CmsListValue[]) => Array.from(new Map(items.map((item) => [valueLabel(item), item])).values()).filter(valueLabel);

export interface ArchivePageProps { projects?: CmsProject[] }

export function ArchivePage({ projects = [] }: ArchivePageProps) {
  const safeProjects = useMemo(() => Array.isArray(projects) ? projects : [], [projects]);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArchiveSelection>(emptySelection);

  const options = useMemo(() => ({
    artists: unique(safeProjects.flatMap((project) => Array.isArray(project.artists) ? project.artists : [])),
    categories: unique(safeProjects.flatMap((project) => Array.isArray(project.categories) ? project.categories : [])),
    style: unique(safeProjects.flatMap((project) => Array.isArray(project.style) ? project.style : [])),
    years: Array.from(new Set(safeProjects.map((project) => project.year).filter(Boolean).map(String))).sort((a, b) => Number(b) - Number(a)),
    palette: Array.from(new Map(safeProjects.flatMap((project) => Array.isArray(project.palette) ? project.palette : []).map((item) => [paletteValue(item), item])).values()).filter((item) => paletteValue(item)),
  }), [safeProjects]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const includesAny = (values: CmsListValue[], chosen: string[]) => chosen.length === 0 || values.some((value) => chosen.includes(valueLabel(value)));
    return safeProjects
      .filter((project) => {
        const artists = Array.isArray(project.artists) ? project.artists : [];
        const categories = Array.isArray(project.categories) ? project.categories : [];
        const projectStyles = Array.isArray(project.style) ? project.style : [];
        const palette = Array.isArray(project.palette) ? project.palette : [];
        const searchable = [project.title || "", project.year, ...artists.map(valueLabel), ...categories.map(valueLabel), ...projectStyles.map(valueLabel)].join(" ").toLocaleLowerCase();
        return (!query || searchable.includes(query))
          && includesAny(artists, selected.artists)
          && includesAny(categories, selected.categories)
          && includesAny(projectStyles, selected.style)
          && (selected.years.length === 0 || selected.years.includes(String(project.year)))
          && (selected.palette.length === 0 || palette.some((value) => selected.palette.includes(paletteValue(value))));
      })
      .sort((a, b) => (b.year || 0) - (a.year || 0) || (b.createdAt || "").localeCompare(a.createdAt || ""));
  }, [safeProjects, search, selected]);

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
