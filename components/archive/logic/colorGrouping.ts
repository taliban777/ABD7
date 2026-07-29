import { FilterOption } from "../types";

/**
 * Categorize a hex color into one of 6 groups based on HSL values.
 */
function categorizeColor(hex: string): string {
  if (!hex || typeof hex !== "string") return "neutral";

  // Parse hex to RGB
  const h = hex.replace("#", "");
  if (h.length !== 6) return "neutral";

  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  // If achromatic (grayscale)
  if (max === min) {
    if (l < 0.2) return "dark";
    if (l > 0.8) return "light";
    return "monochrome";
  }

  // Calculate hue
  const c = max - min;
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

  // Categorize by hue
  if (hue < 30 || hue >= 330) return "warm"; // reds, oranges, warm yellows
  if (hue < 90) return "warm"; // yellows
  if (hue < 150) return "cool"; // greens
  if (hue < 270) return "cool"; // blues, cyans, purples
  return "warm"; // magentas back to reds
}

/**
 * Group palette colors into 6 curated categories and return as FilterOption[].
 * Each option becomes a group label (e.g. "Warm") that can be toggled to select
 * all colors in that category.
 */
export function groupPaletteColors(colorOptions: FilterOption[]): FilterOption[] {
  const groups: Map<string, FilterOption[]> = new Map([
    ["warm", []],
    ["cool", []],
    ["neutral", []],
    ["dark", []],
    ["light", []],
    ["monochrome", []],
  ]);

  // Categorize each color
  for (const option of colorOptions) {
    const group = categorizeColor(option.color || option.value);
    const list = groups.get(group) || [];
    list.push(option);
    groups.set(group, list);
  }

  // Convert groups to FilterOption[] with combined counts
  const groupLabels: Record<string, string> = {
    warm: "Warm",
    cool: "Cool",
    neutral: "Neutral",
    dark: "Dark",
    light: "Light",
    monochrome: "Monochrome",
  };

  return Array.from(groups.entries())
    .filter(([, colors]) => colors.length > 0)
    .map(([key, colors]) => ({
      label: groupLabels[key] || key,
      value: key, // Use group key as value for filtering
      count: colors.reduce((sum, c) => sum + c.count, 0),
      // Store the actual color values for the group as a special property
      _groupColors: colors.map((c) => c.value),
    })) as unknown as FilterOption[];
}
