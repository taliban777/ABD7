import { FilterOption } from "../types";

interface ColorFamily {
  name: string;
  label: string;
  hueRange: [number, number]; // [start, end] in degrees
  lightnessRange?: [number, number]; // [min, max] as 0-100
}

const COLOR_FAMILIES: ColorFamily[] = [
  { name: "black", label: "Black", hueRange: [0, 360], lightnessRange: [0, 20] },
  { name: "white", label: "White", hueRange: [0, 360], lightnessRange: [80, 100] },
  { name: "grey", label: "Grey", hueRange: [0, 360], lightnessRange: [20, 80] },
  { name: "red", label: "Red", hueRange: [330, 30] },
  { name: "orange", label: "Orange", hueRange: [30, 60] },
  { name: "yellow", label: "Yellow", hueRange: [60, 90] },
  { name: "green", label: "Green", hueRange: [90, 180] },
  { name: "blue", label: "Blue", hueRange: [180, 270] },
  { name: "purple", label: "Purple", hueRange: [270, 300] },
  { name: "pink", label: "Pink", hueRange: [300, 330] },
];

/**
 * Convert hex color to HSL and categorize into a color family.
 * Returns the family name that can be used for filtering.
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

  // Calculate saturation
  const s = c === 0 ? 0 : c / (1 - Math.abs(2 * l - 1));

  // Calculate hue
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
 * Calculate average color from a list of hex values for visual display.
 */
function averageColor(hexColors: string[]): string {
  if (hexColors.length === 0) return "#888888";

  let totalR = 0,
    totalG = 0,
    totalB = 0;
  let count = 0;

  for (const hex of hexColors) {
    const clean = hex.replace("#", "");
    if (clean.length === 6) {
      totalR += parseInt(clean.substring(0, 2), 16);
      totalG += parseInt(clean.substring(2, 4), 16);
      totalB += parseInt(clean.substring(4, 6), 16);
      count++;
    }
  }

  if (count === 0) return "#888888";

  const avgR = Math.round(totalR / count);
  const avgG = Math.round(totalG / count);
  const avgB = Math.round(totalB / count);

  return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
}

/**
 * Group palette colors by hex value into color families.
 * Maps each hex value to its family name, then aggregates by family.
 * Returns FilterOptions where the value is the family name (for filtering),
 * and count is the number of individual hex colors in that family.
 */
export function groupPaletteColors(colorOptions: FilterOption[]): FilterOption[] {
  const familyMap = new Map<string, { hexes: string[]; count: number }>();

  // Initialize all families
  for (const family of COLOR_FAMILIES) {
    familyMap.set(family.name, { hexes: [], count: 0 });
  }

  // Map each color option to its family and aggregate
  for (const option of colorOptions) {
    const hex = option.color || option.value;
    const family = categorizeHexToFamily(hex);
    const existing = familyMap.get(family) || { hexes: [], count: 0 };

    // Store unique hex values and accumulate counts
    if (!existing.hexes.includes(hex)) {
      existing.hexes.push(hex);
    }
    existing.count += option.count;

    familyMap.set(family, existing);
  }

  // Convert to FilterOption[] in display order
  const displayOrder = ["black", "white", "grey", "red", "orange", "yellow", "green", "blue", "purple", "pink"];

  return displayOrder
    .map((familyName) => {
      const family = COLOR_FAMILIES.find((f) => f.name === familyName);
      const data = familyMap.get(familyName);

      if (!family || !data || data.count === 0) return null;

      return {
        label: family.label,
        value: familyName,
        count: data.count, // Total number of projects with colors in this family
        color: averageColor(data.hexes), // Representative color from all hex values in family
        // Internal: list of hex values for reference
        _groupHexes: data.hexes,
      };
    })
    .filter((opt) => opt !== null) as FilterOption[];
}
