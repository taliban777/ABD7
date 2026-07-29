import { ArchiveFilterKey, ArchiveSelection, CmsProject, asArray, paletteValue, valueLabel } from "../types";

export interface ArchiveQuery {
  search: string;
  selected: ArchiveSelection;
}

// Color family definitions - must match colorGrouping.ts
interface ColorFamily {
  name: string;
  hueRange: [number, number];
  lightnessRange?: [number, number];
}

const COLOR_FAMILIES: ColorFamily[] = [
  { name: "black", hueRange: [0, 360], lightnessRange: [0, 20] },
  { name: "white", hueRange: [0, 360], lightnessRange: [80, 100] },
  { name: "grey", hueRange: [0, 360], lightnessRange: [20, 80] },
  { name: "red", hueRange: [330, 30] },
  { name: "orange", hueRange: [30, 60] },
  { name: "yellow", hueRange: [60, 90] },
  { name: "green", hueRange: [90, 180] },
  { name: "blue", hueRange: [180, 270] },
  { name: "purple", hueRange: [270, 300] },
  { name: "pink", hueRange: [300, 330] },
];

/**
 * Categorize a hex color into a family name.
 * Must match the logic in colorGrouping.ts.
 */
function categorizeHexToFamily(hex: string): string {
  if (!hex || typeof hex !== "string") return "grey";

  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "grey";

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const c = max - min;

  const s = c === 0 ? 0 : c / (1 - Math.abs(2 * l - 1));

  let hue = 0;
  if (c !== 0) {
    if (max === r) {
      hue = (((g - b) / c) % 6 + 6) % 6;
    } else if (max === g) {
      hue = (b - r) / c + 2;
    } else {
      hue = (r - g) / c + 4;
    }
  }
  hue *= 60;
  if (hue < 0) hue += 360;

  const lightness = l * 100;

  // Check lightness first for achromatic colors
  for (const family of COLOR_FAMILIES) {
    if (family.lightnessRange) {
      const [minL, maxL] = family.lightnessRange;
      if (lightness >= minL && lightness <= maxL) {
        return family.name;
      }
    }
  }

  // Then check chromatic colors by hue
  if (s > 0.1) {
    for (const family of COLOR_FAMILIES) {
      if (!family.lightnessRange) {
        const [startHue, endHue] = family.hueRange;
        const inRange =
          startHue <= endHue
            ? hue >= startHue && hue < endHue
            : hue >= startHue || hue < endHue;
        if (inRange) {
          return family.name;
        }
      }
    }
  }

  return "grey";
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
      // Map each palette hex value to its color family, deduplicate
      const families = new Set(
        asArray(project.palette)
          .map(paletteValue)
          .filter(Boolean)
          .map(categorizeHexToFamily)
      );
      return Array.from(families);
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
