import { ArchiveFilterKey, ArchiveFilterOptions, ArchiveSelection, CmsProject, FilterOption, asArray, paletteValue, valueLabel } from "../types";
import { matchesFilters, matchesSearch } from "./filterProjects";
import { groupPaletteColors } from "./colorGrouping";

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
    // For palette, return raw hex values - these will be grouped later by color family
    return asArray(project.palette)
      .map((item) => {
        const hex = paletteValue(item);
        return { value: hex, label: valueLabel(item) || hex, color: hex };
      })
      .filter((option) => option.value);
  }
  return asArray(project[key])
    .map((item) => ({ value: valueLabel(item), label: valueLabel(item) }))
    .filter((option) => option.value);
}

/**
 * Tally options for one group. For palette, collect all unique hex values per project.
 * Counts are computed against the projects that match search + every *other* active group.
 */
function tally(projects: CmsProject[], key: ArchiveFilterKey): FilterOption[] {
  if (key === "palette") {
    // For palette: collect all unique hex values and count projects that contain them
    const hexMap = new Map<string, { label: string; projects: Set<string> }>();

    for (const project of projects) {
      const projectHexes = new Set<string>();
      for (const option of projectOptions(project, key)) {
        projectHexes.add(option.value);
      }

      // Count each unique hex once per project
      for (const hex of projectHexes) {
        const existing = hexMap.get(hex);
        if (existing) {
          existing.projects.add(project.id || "");
        } else {
          hexMap.set(hex, { label: projectOptions(project, key).find((o) => o.value === hex)?.label || hex, projects: new Set([project.id || ""]) });
        }
      }
    }

    // Convert to FilterOptions with project counts
    return Array.from(hexMap.entries()).map(([hex, data]) => ({
      label: data.label,
      value: hex,
      color: hex,
      count: data.projects.size,
    }));
  }

  // Non-palette: standard tally
  const map = new Map<string, FilterOption>();
  for (const project of projects) {
    const seen = new Set<string>();
    for (const option of projectOptions(project, key)) {
      if (seen.has(option.value)) continue;
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

  // Group palette colors into 6 categories
  const paletteRaw = build("palette");
  const paletteGrouped = groupPaletteColors(paletteRaw);

  return {
    artists: build("artists"),
    categories: build("categories"),
    style: build("style"),
    years,
    palette: paletteGrouped,
  };
}
