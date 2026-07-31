/**
 * Colour-family classification, shared by the Colophon statistics and the
 * Chromatic Distribution. Previously duplicated inside ColophonPage.
 */

export const COLOUR_FAMILIES = [
  "Red / Pink",
  "Warm Earth",
  "Gold / Yellow",
  "Green",
  "Blue",
  "Purple",
  "Neutral",
  "Dark",
] as const;

export type ColourFamily = (typeof COLOUR_FAMILIES)[number];

/** Classify a hex value into a human-readable colour family. */
export function categorizeHex(hex: string): ColourFamily {
  if (!hex) return "Neutral";
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "Neutral";

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
    if (max === r) hue = ((((g - b) / c) % 6) + 6) % 6;
    else if (max === g) hue = (b - r) / c + 2;
    else hue = (r - g) / c + 4;
  }
  hue *= 60;

  const lightness = l * 100;
  if (lightness < 25) return "Dark";
  if (s < 0.15) return "Neutral";
  if (hue < 15 || hue >= 345) return "Red / Pink";
  if (hue >= 15 && hue < 45) return lightness < 50 ? "Warm Earth" : "Gold / Yellow";
  if (hue >= 45 && hue < 75) return "Gold / Yellow";
  if (hue >= 75 && hue < 165) return "Green";
  if (hue >= 165 && hue < 255) return "Blue";
  if (hue >= 255 && hue < 295) return "Purple";
  return "Red / Pink";
}
