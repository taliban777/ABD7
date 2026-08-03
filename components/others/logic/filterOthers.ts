import { CmsOther, OthersFilterKey, OthersSelection } from "../types";

export interface OthersQuery {
  search: string;
  selected: OthersSelection;
}

/**
 * Flatten searchable fields (title, type, tags) into one lowercase string.
 */
export function buildOthersSearchIndex(item: CmsOther): string {
  return [item.title || "", item.type || "", ...(item.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase();
}

export function matchesOthersSearch(item: CmsOther, search: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  if (!query) return true;
  return buildOthersSearchIndex(item).includes(query);
}

/** Values an item contributes to a given filter group. */
export function itemValuesFor(item: CmsOther, key: OthersFilterKey): string[] {
  switch (key) {
    case "types":
      return item.type ? [item.type] : [];
    case "projects":
      return [item.groupSlug || "__standalone__"];
    default:
      return [];
  }
}

/** OR within a group. */
export function matchesOthersGroup(item: CmsOther, key: OthersFilterKey, chosen: string[]): boolean {
  if (chosen.length === 0) return true;
  return itemValuesFor(item, key).some((v) => chosen.includes(v));
}

/** AND between groups, optionally skipping one for facet counts. */
export function matchesOthersFilters(item: CmsOther, selected: OthersSelection, exceptKey?: OthersFilterKey): boolean {
  return (Object.keys(selected) as OthersFilterKey[]).every((key) =>
    key === exceptKey ? true : matchesOthersGroup(item, key, selected[key])
  );
}

/** Apply search + all filter groups. */
export function filterOthers(items: CmsOther[], { search, selected }: OthersQuery): CmsOther[] {
  return items.filter((item) => matchesOthersSearch(item, search) && matchesOthersFilters(item, selected));
}
