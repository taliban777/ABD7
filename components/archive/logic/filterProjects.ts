import { ArchiveFilterKey, ArchiveSelection, CmsProject, asArray, paletteValue, valueLabel } from "../types";

export interface ArchiveQuery {
  search: string;
  selected: ArchiveSelection;
}

/**
 * Flatten every searchable field of a project into one lowercase string.
 * Covers title, artist names, categories, style, year and palette values.
 * Missing fields are handled safely so new/partial CMS entries never throw.
 */
export function buildSearchIndex(project: CmsProject): string {
  const labels = [
    ...asArray(project.artists).map(valueLabel),
    ...asArray(project.categories).map(valueLabel),
    ...asArray(project.style).map(valueLabel),
  ];
  const palette = asArray(project.palette).map(paletteValue);
  return [project.title || "", project.year != null ? String(project.year) : "", ...labels, ...palette]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

/** Case-insensitive, live search. An empty query matches everything. */
export function matchesSearch(project: CmsProject, search: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return true;
  return buildSearchIndex(project).includes(query);
}

/** The distinct set of selectable values a project contributes to a given filter group. */
export function projectValuesFor(project: CmsProject, key: ArchiveFilterKey): string[] {
  switch (key) {
    case "years":
      return project.year != null ? [String(project.year)] : [];
    case "palette":
      return asArray(project.palette).map(paletteValue).filter(Boolean);
    default:
      return asArray(project[key]).map(valueLabel).filter(Boolean);
  }
}

/** OR logic *within* a group: a project matches if it has any of the chosen values. */
export function matchesGroup(project: CmsProject, key: ArchiveFilterKey, chosen: string[]): boolean {
  if (chosen.length === 0) return true;
  return projectValuesFor(project, key).some((value) => chosen.includes(value));
}

/**
 * AND logic *between* groups. Optionally skip one group (`exceptKey`) so facet
 * counts for that group stay meaningful while it has active selections.
 */
export function matchesFilters(project: CmsProject, selected: ArchiveSelection, exceptKey?: ArchiveFilterKey): boolean {
  return (Object.keys(selected) as ArchiveFilterKey[]).every((key) =>
    key === exceptKey ? true : matchesGroup(project, key, selected[key])
  );
}

/** Apply search + all filter groups (AND between groups, OR within a group). */
export function filterProjects(projects: CmsProject[], { search, selected }: ArchiveQuery): CmsProject[] {
  return projects.filter((project) => matchesSearch(project, search) && matchesFilters(project, selected));
}
