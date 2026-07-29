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
 */
function categorizeColorToFamily(hex: string): string {
  if (!hex || typeof hex !== "string") return "grey";

  const h = hex.replace("#", "");
  if (h.length !== 6) return "grey";

  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

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

  // Find matching family
  for (const family of COLOR_FAMILIES) {
    // Check lightness first for achromatic colors
    if (family.lightnessRange) {
      const [minL, maxL] = family.lightnessRange;
      if (lightness >= minL && lightness <= maxL) {
        return family.name;
      }
    } else if (s > 0.1) {
      // Chromatic colors: check hue range
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

  return "grey";
}

/**
 * Calculate average color from a list of hex values.
 */
function averageColor(hexColors: string[]): string {
  if (hexColors.length === 0) return "#888888";

  let totalR = 0,
    totalG = 0,
    totalB = 0;

  for (const hex of hexColors) {
    const h = hex.replace("#", "");
    if (h.length === 6) {
      totalR += parseInt(h.substring(0, 2), 16);
      totalG += parseInt(h.substring(2, 4), 16);
      totalB += parseInt(h.substring(4, 6), 16);
    }
  }

  const avgR = Math.round(totalR / hexColors.length);
  const avgG = Math.round(totalG / hexColors.length);
  const avgB = Math.round(totalB / hexColors.length);

  return `#${avgR.toString(16).padStart(2, "0")}${avgG.toString(16).padStart(2, "0")}${avgB.toString(16).padStart(2, "0")}`;
}

/**
 * Group palette colors by actual HSL values into 11 color families.
 * Returns FilterOptions where each option represents a color family.
 * Clicking a category returns all projects with colors in that family.
 */
export function groupPaletteColors(colorOptions: FilterOption[]): FilterOption[] {
  const groups: Map<string, FilterOption[]> = new Map();

  // Initialize all color families
  for (const family of COLOR_FAMILIES) {
    groups.set(family.name, []);
  }

  // Categorize each color into a family
  for (const option of colorOptions) {
    const family = categorizeColorToFamily(option.color || option.value);
    const list = groups.get(family) || [];
    list.push(option);
    groups.set(family, list);
  }

  // Convert to FilterOption[] in display order
  const displayOrder = ["black", "white", "grey", "red", "orange", "yellow", "green", "blue", "purple", "pink"];

  return displayOrder
    .filter((name) => (groups.get(name) || []).length > 0)
    .map((name) => {
      const colors = groups.get(name) || [];
      const family = COLOR_FAMILIES.find((f) => f.name === name);
      const hexValues = colors.map((c) => c.color || c.value);

      return {
        label: family?.label || name,
        value: name,
        count: colors.reduce((sum, c) => sum + c.count, 0),
        // Representative color for visual display (average of all colors in family)
        color: averageColor(hexValues),
        // Preserve original hex values for filtering
        _groupColors: hexValues,
      };
    }) as unknown as FilterOption[];
}
