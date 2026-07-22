import { ArchiveFilterKey, ArchiveFilterOptions, ArchiveSelection, CmsProject, FilterOption, asArray, paletteValue, valueLabel } from "../types";
import { matchesFilters, matchesSearch } from "./filterProjects";

interface RawOption {
  label: string;
  value: string;
  color?: string;
}

/** The raw, distinct option values a project contributes to a group (keeps labels + colours). */
function projectOptions(project: CmsProject, key: ArchiveFilterKey): RawOption[] {
  if (key === "years") {
    return project.year != null ? [{ label: String(project.year), value: String(project.year) }] : [];
  }
  if (key === "palette") {
    return asArray(project.palette)
      .map((item) => ({ value: paletteValue(item), label: valueLabel(item) || paletteValue(item), color: paletteValue(item) }))
      .filter((option) => option.value);
  }
  return asArray(project[key])
    .map((item) => ({ value: valueLabel(item), label: valueLabel(item) }))
    .filter((option) => option.value);
}

/**
 * Tally options for one group. Counts are computed against the projects that
 * match search + every *other* active group, so numbers reflect what selecting
 * an option would actually yield and update live as the query changes.
 */
function tally(projects: CmsProject[], key: ArchiveFilterKey): FilterOption[] {
  const map = new Map<string, FilterOption>();
  for (const project of projects) {
    const seen = new Set<string>();
    for (const option of projectOptions(project, key)) {
      if (seen.has(option.value)) continue; // count each project once per value
      seen.add(option.value);
      const existing = map.get(option.value);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(option.value, { label: option.label, value: option.value, count: 1, color: option.color });
      }
    }
  }
  return Array.from(map.values());
}

/** Ensure any currently selected value still appears, even if its live count is 0. */
function withSelected(options: FilterOption[], selectedValues: string[]): FilterOption[] {
  const present = new Set(options.map((option) => option.value));
  const merged = [...options];
  for (const value of selectedValues) {
    if (!present.has(value)) merged.push({ label: value, value, count: 0 });
  }
  return merged;
}

const byCountThenLabel = (a: FilterOption, b: FilterOption) =>
  b.count - a.count || a.label.localeCompare(b.label, undefined, { numeric: true });

/**
 * Derive every filter group's options from CMS data. Fully dynamic: new projects,
 * artists, styles, palette values, etc. appear automatically with no hardcoding.
 */
export function extractFilterOptions(projects: CmsProject[], selected: ArchiveSelection, search: string): ArchiveFilterOptions {
  const scoped = (key: ArchiveFilterKey) =>
    projects.filter((project) => matchesSearch(project, search) && matchesFilters(project, selected, key));

  const build = (key: Exclude<ArchiveFilterKey, "years">) =>
    withSelected(tally(scoped(key), key), selected[key]).sort(byCountThenLabel);

  const years = withSelected(tally(scoped("years"), "years"), selected.years).sort(
    (a, b) => Number(b.value) - Number(a.value)
  );

  return {
    artists: build("artists"),
    categories: build("categories"),
    style: build("style"),
    years,
    palette: build("palette"),
  };
}
