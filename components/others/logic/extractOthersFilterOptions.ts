import { CmsOther, OthersFilterKey, OthersFilterOptions, OthersFilterOption, OthersSelection, projectLabel } from "../types";
import { matchesOthersFilters, matchesOthersSearch } from "./filterOthers";

interface RawOption {
  label: string;
  value: string;
}

function itemOptions(item: CmsOther, key: OthersFilterKey): RawOption[] {
  if (key === "types") {
    return item.type ? [{ label: item.type, value: item.type }] : [];
  }
  if (key === "projects") {
    const slug = item.groupSlug || "__standalone__";
    return [{ label: projectLabel(slug), value: slug }];
  }
  return [];
}

function tally(items: CmsOther[], key: OthersFilterKey): OthersFilterOption[] {
  const map = new Map<string, OthersFilterOption>();
  for (const item of items) {
    const seen = new Set<string>();
    for (const option of itemOptions(item, key)) {
      if (seen.has(option.value)) continue;
      seen.add(option.value);
      const existing = map.get(option.value);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(option.value, { label: option.label, value: option.value, count: 1 });
      }
    }
  }
  return Array.from(map.values());
}

function withSelected(options: OthersFilterOption[], selectedValues: string[]): OthersFilterOption[] {
  const present = new Set(options.map((o) => o.value));
  const merged = [...options];
  for (const value of selectedValues) {
    if (!present.has(value)) merged.push({ label: projectLabel(value), value, count: 0 });
  }
  return merged;
}

const byCountThenLabel = (a: OthersFilterOption, b: OthersFilterOption) =>
  b.count - a.count || a.label.localeCompare(b.label, undefined, { numeric: true });

/**
 * Derive filter options dynamically from CMS data.
 */
export function extractOthersFilterOptions(
  items: CmsOther[],
  selected: OthersSelection,
  search: string
): OthersFilterOptions {
  const scoped = (key: OthersFilterKey) =>
    items.filter((item) => matchesOthersSearch(item, search) && matchesOthersFilters(item, selected, key));

  const build = (key: OthersFilterKey) =>
    withSelected(tally(scoped(key), key), selected[key]).sort(byCountThenLabel);

  return {
    types: build("types"),
    projects: build("projects"),
  };
}
