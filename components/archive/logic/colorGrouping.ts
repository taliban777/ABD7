import { FilterOption } from "../types";

interface ColorCategory {
  name: string;
  label: string;
}

const CATEGORIES: ColorCategory[] = [
  { name: "dark", label: "Dark" },
  { name: "neutral", label: "Neutral" },
  { name: "warm-earth", label: "Warm Earth" },
  { name: "red-pink", label: "Red / Pink" },
  { name: "gold-yellow", label: "Gold / Yellow" },
  { name: "green", label: "Green" },
  { name: "blue", label: "Blue" },
  { name: "purple", label: "Purple" },
];

/**
 * Editorial color taxonomy for art archives.
 * Prioritizes hue-based classification with tone refinement.
 * Maps hex values to meaningful visual categories for browsing.
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

  // Calculate saturation and hue
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

  // Check if near-black or very dark (prioritize this for all dark tones)
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
  // Hue ranges: 0-360 degrees (Red: 0 | Yellow: 60 | Green: 120 | Cyan: 180 | Blue: 240 | Magenta: 300)

  if (hue < 15 || hue >= 345) {
    // Red/Pink range (0-15, 345-360)
    return "red-pink";
  }

  if (hue >= 15 && hue < 45) {
    // Orange/Gold transition - classify based on lightness
    // Darker oranges → warm-earth, brighter → gold-yellow
    if (lightness < 50) {
      return "warm-earth";
    }
    return "gold-yellow";
  }

  if (hue >= 45 && hue < 75) {
    // Yellow/Gold range
    return "gold-yellow";
  }

  if (hue >= 75 && hue < 165) {
    // Green range (even dark greens stay green)
    return "green";
  }

  if (hue >= 165 && hue < 255) {
    // Blue/Cyan range (even dark blues stay blue)
    return "blue";
  }

  if (hue >= 255 && hue < 295) {
    // Purple range (even dark purples stay purple)
    return "purple";
  }

  if (hue >= 295 && hue < 345) {
    // Pink/Magenta range
    return "red-pink";
  }

  // Brown/tan fallback: classify by hue and saturation
  if (hue >= 15 && hue < 50 && s > 0.15) {
    return "warm-earth";
  }

  return "neutral";
}

/**
 * Calculate representative color from a list of hex values.
 * For visual display, selects the median color by perceived brightness
 * to avoid averaging making colors muddy.
 */
function representativeColor(hexColors: string[]): string {
  if (hexColors.length === 0) return "#888888";
  if (hexColors.length === 1) return hexColors[0];

  // Sort by perceived lightness and pick median
  const sorted = hexColors
    .map((hex) => {
      const clean = hex.replace("#", "");
      if (clean.length !== 6) return { hex, lightness: 50 };
      const r = parseInt(clean.substring(0, 2), 16);
      const g = parseInt(clean.substring(2, 4), 16);
      const b = parseInt(clean.substring(4, 6), 16);
      const lightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      return { hex, lightness };
    })
    .sort((a, b) => a.lightness - b.lightness);

  return sorted[Math.floor(sorted.length / 2)].hex;
}

/**
 * Group palette colors by editorial category.
 * Maps each hex value to a category, then aggregates projects per category.
 * Returns FilterOptions for the category selector with project counts.
 */
export function groupPaletteColors(colorOptions: FilterOption[]): FilterOption[] {
  const categoryMap = new Map<string, { hexes: Set<string>; projectCount: number }>();

  // Initialize all categories
  for (const category of CATEGORIES) {
    categoryMap.set(category.name, { hexes: new Set(), projectCount: 0 });
  }

  // Map each hex color to its category and tally projects
  for (const option of colorOptions) {
    const hex = option.color || option.value;
    const category = categorizeHexToCategory(hex);
    const existing = categoryMap.get(category) || { hexes: new Set(), projectCount: 0 };

    existing.hexes.add(hex);
    existing.projectCount += option.count;

    categoryMap.set(category, existing);
  }

  // Convert to FilterOption[] in display order
  return CATEGORIES.map((category) => {
    const data = categoryMap.get(category.name);

    if (!data || data.projectCount === 0) return null;

    return {
      label: category.label,
      value: category.name,
      count: data.projectCount, // Total number of projects with colors in this category
      color: representativeColor(Array.from(data.hexes)), // Representative color from all hex values
      // Internal: list of hex values for reference
      _groupHexes: Array.from(data.hexes),
    };
  }).filter((opt) => opt !== null) as FilterOption[];
}
