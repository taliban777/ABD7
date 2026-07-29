import { ArchiveFilterKey, ArchiveSelection, CmsProject, asArray, paletteValue, valueLabel } from "../types";

export interface ArchiveQuery {
  search: string;
  selected: ArchiveSelection;
}

// Color category definitions - must match colorGrouping.ts
// Editorial taxonomy for art archives based on hue + tone

/**
 * Categorize a hex color into an editorial category.
 * Must match the logic in colorGrouping.ts.
 * Prioritizes hue-based classification with tone refinement.
 */
function categorizeHexToCategory(hex: string): string {
  if (!hex || typeof hex !== "string") return "neutral";

  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "neutral";

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

  // Check if near-black or very dark
  if (lightness < 25) {
    return "dark";
  }

  // Check if near-white or very light
  if (lightness > 85 && s < 0.15) {
    return "neutral";
  }

  // For greyish/desaturated colors
  if (s < 0.15) {
    return "neutral";
  }

  // Hue-based classification for saturated colors
  if (hue < 15 || hue >= 345) {
    return "red-pink";
  }

  if (hue >= 15 && hue < 45) {
    if (lightness < 50) {
      return "warm-earth";
    }
    return "gold-yellow";
  }

  if (hue >= 45 && hue < 75) {
    return "gold-yellow";
  }

  if (hue >= 75 && hue < 165) {
    return "green";
  }

  if (hue >= 165 && hue < 255) {
    return "blue";
  }

  if (hue >= 255 && hue < 295) {
    return "purple";
  }

  if (hue >= 295 && hue < 345) {
    return "red-pink";
  }

  if (hue >= 15 && hue < 50 && s > 0.15) {
    return "warm-earth";
  }

  return "neutral";
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
      // Map each palette hex value to its editorial category, deduplicate
      const categories = new Set(
        asArray(project.palette)
          .map(paletteValue)
          .filter(Boolean)
          .map(categorizeHexToCategory)
      );
      return Array.from(categories);
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
