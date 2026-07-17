export type CmsListValue = string | { name?: string; title?: string; label?: string; value?: string; color?: string; hex?: string };

export interface CmsProject {
  id: string;
  title: string;
  frontCover: string;
  artists: CmsListValue[];
  categories: CmsListValue[];
  style: CmsListValue[];
  palette: CmsListValue[];
  year?: number;
  createdAt?: string;
}

export interface ArchiveSelection {
  artists: string[];
  categories: string[];
  style: string[];
  years: string[];
  palette: string[];
}

export type ArchiveFilterKey = keyof ArchiveSelection;

export function valueLabel(value: CmsListValue): string {
  if (typeof value === "string") return value;
  return value.name || value.title || value.label || value.value || value.color || value.hex || "";
}

export function paletteValue(value: CmsListValue): string {
  if (typeof value === "string") return value;
  return value.hex || value.color || value.value || value.name || "";
}
